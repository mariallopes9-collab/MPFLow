"""Backend Multiperfil Live: Flask + SQLite (arquivo local, sem custo).

Rodar:  pip install -r requirements.txt  &&  python app.py
Variável opcional ADMIN_EMAIL: quem se cadastra com esse e-mail já vira Gerente aprovado.
O banco fica em backend/data/multiperfil.db (criado automaticamente).
"""
import json, math, os, secrets, sqlite3, uuid
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, g, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('DB_PATH', os.path.join(BASE, 'data', 'multiperfil.db'))
DIST = os.path.join(BASE, '..', 'dist')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@multiperfil.com').strip().lower()
# Credenciais do administrador para o protótipo/apresentação.
# Em produção, defina ADMIN_PASSWORD como variável de ambiente e não deixe a senha no código.
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
ADMIN_NAME = os.environ.get('ADMIN_NAME', 'Administrador')
CARGOS = {'Gerente', 'Qualidade', 'Verificação', 'Envase', 'Laboratório'}
STATUS = {'pendente', 'aprovado', 'recusado'}
FACE_LIMITE = float(os.environ.get('FACE_LIMITE', 0.5))  # distância máxima entre rostos (mesmo valor do Face ID das etapas)

app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

SCHEMA = """
create table if not exists users (
  id text primary key, email text unique not null, senha_hash text not null,
  nome text not null, cargo text not null default 'Qualidade', telefone text default '',
  status text not null default 'pendente', face_descriptor text, face_foto text);
create table if not exists sessions (token text primary key, user_id text not null, created_at text);
create table if not exists produtos (id text primary key, nome text not null, categoria text not null, embalagem text not null);
create table if not exists ops (id_op text primary key, data text not null, updated_at text);
create table if not exists notificacoes (id text primary key, mensagem text not null, usuario text, created_at text);
"""


def now():
    return datetime.now(timezone.utc).isoformat()


def db():
    if 'db' not in g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    d = g.pop('db', None)
    if d:
        d.close()


with app.app_context():
    db().executescript(SCHEMA)

    # Garante que o administrador exista e possa entrar diretamente.
    # Se a conta já existir, a senha definida acima é atualizada.
    admin = db().execute('select id from users where email=?', (ADMIN_EMAIL,)).fetchone()
    if admin:
        db().execute(
            'update users set senha_hash=?, nome=?, cargo=?, status=? where email=?',
            (generate_password_hash(ADMIN_PASSWORD), ADMIN_NAME, 'Gerente', 'aprovado', ADMIN_EMAIL)
        )
    else:
        db().execute(
            'insert into users (id,email,senha_hash,nome,cargo,status) values (?,?,?,?,?,?)',
            (uuid.uuid4().hex, ADMIN_EMAIL, generate_password_hash(ADMIN_PASSWORD), ADMIN_NAME, 'Gerente', 'aprovado')
        )
    db().commit()


def profile(u):
    return {'email': u['email'], 'nome': u['nome'], 'cargo': u['cargo'], 'telefone': u['telefone'] or '',
            'status': u['status'], 'face': json.loads(u['face_descriptor']) if u['face_descriptor'] else None,
            'foto': u['face_foto']}


def need(level='user'):
    """level: user (logado) | approved (logado e aprovado) | admin (gerente aprovado)."""
    def deco(f):
        @wraps(f)
        def wrapper(*a, **k):
            h = request.headers.get('Authorization', '')
            token = h[7:] if h.startswith('Bearer ') else ''
            u = db().execute('select u.* from sessions s join users u on u.id = s.user_id where s.token = ?', (token,)).fetchone()
            if not u:
                return jsonify(erro='Faça login para continuar.'), 401
            if level in ('approved', 'admin') and u['status'] != 'aprovado':
                return jsonify(erro='Seu acesso ainda não foi aprovado pelo gerente.'), 403
            if level == 'admin' and u['cargo'] != 'Gerente':
                return jsonify(erro='Apenas o gerente pode fazer isso.'), 403
            g.user = u
            return f(*a, **k)
        return wrapper
    return deco


# ---------- autenticação ----------
@app.post('/api/auth/register')
def register():
    d = request.get_json(force=True, silent=True) or {}
    email, senha, nome = str(d.get('email', '')).strip().lower(), str(d.get('senha', '')), str(d.get('nome', '')).strip()
    if '@' not in email or len(senha) < 6 or not nome:
        return jsonify(erro='Informe nome, e-mail válido e senha com 6+ caracteres.'), 400
    cargo = d.get('cargo') if d.get('cargo') in CARGOS - {'Gerente'} else 'Qualidade'
    status = 'pendente'
    if email == ADMIN_EMAIL:
        cargo, status = 'Gerente', 'aprovado'
    try:
        db().execute('insert into users (id,email,senha_hash,nome,cargo,status) values (?,?,?,?,?,?)',
                     (uuid.uuid4().hex, email, generate_password_hash(senha), nome, cargo, status))
        db().commit()
    except sqlite3.IntegrityError:
        return jsonify(erro='Este e-mail já está cadastrado.'), 409
    return jsonify(ok=True), 201


@app.post('/api/auth/login')
def login():
    d = request.get_json(force=True, silent=True) or {}
    u = db().execute('select * from users where email = ?', (str(d.get('email', '')).strip().lower(),)).fetchone()
    if not u or not check_password_hash(u['senha_hash'], str(d.get('senha', ''))):
        return jsonify(erro='E-mail ou senha incorretos.'), 401
    token = secrets.token_urlsafe(32)
    db().execute('insert into sessions values (?,?,?)', (token, u['id'], now()))
    db().commit()
    return jsonify(token=token, user=profile(u))


@app.post('/api/auth/face-login')
def face_login():
    """Login por ID facial: compara o rosto lido com os rostos cadastrados (só contas aprovadas)."""
    d = request.get_json(force=True, silent=True) or {}
    v = d.get('descriptor')
    if not isinstance(v, list) or len(v) != 128 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
        return jsonify(erro='Leitura facial inválida.'), 400
    melhor, menor = None, float('inf')
    for u in db().execute("select * from users where status='aprovado' and face_descriptor is not null"):
        try:
            ref = json.loads(u['face_descriptor'])
            if len(ref) != 128:
                continue
            dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(v, ref)))
        except (ValueError, TypeError):
            continue
        if dist < menor:
            melhor, menor = u, dist
    if melhor is None or menor >= FACE_LIMITE:
        return jsonify(erro='Rosto não reconhecido ou conta ainda sem aprovação.'), 401
    token = secrets.token_urlsafe(32)
    db().execute('insert into sessions values (?,?,?)', (token, melhor['id'], now()))
    db().commit()
    return jsonify(token=token, user=profile(melhor))


@app.post('/api/auth/logout')
@need()
def logout():
    db().execute('delete from sessions where user_id = ? and token = ?', (g.user['id'], request.headers['Authorization'][7:]))
    db().commit()
    return jsonify(ok=True)


@app.get('/api/me')
@need()
def me():
    return jsonify(profile(g.user))


@app.put('/api/me')
@need()
def update_me():
    d = request.get_json(force=True, silent=True) or {}
    u = g.user
    nome = str(d.get('nome', u['nome'])).strip() or u['nome']
    tel = str(d.get('telefone', u['telefone'] or ''))
    face = json.dumps(d['face']) if d.get('face') else u['face_descriptor']
    foto = d['foto'] if d.get('foto') else u['face_foto']
    db().execute('update users set nome=?, telefone=?, face_descriptor=?, face_foto=? where id=?', (nome, tel, face, foto, u['id']))
    db().commit()
    return jsonify(profile(db().execute('select * from users where id=?', (u['id'],)).fetchone()))


# ---------- equipe (gerente) ----------
@app.get('/api/profiles')
@need('admin')
def profiles():
    rows = db().execute('select id,nome,cargo,status,face_descriptor,face_foto from users order by nome').fetchall()
    return jsonify([{**{k: r[k] for k in ('id', 'nome', 'cargo', 'status', 'face_foto')}, 'face_descriptor': bool(r['face_descriptor'])} for r in rows])


@app.put('/api/profiles/<uid>')
@need('admin')
def set_profile(uid):
    d = request.get_json(force=True, silent=True) or {}
    if d.get('status') not in STATUS or d.get('cargo') not in CARGOS:
        return jsonify(erro='Status ou cargo inválido.'), 400
    if uid == g.user['id'] and (d['status'] != 'aprovado' or d['cargo'] != 'Gerente'):
        return jsonify(erro='Você não pode remover o seu próprio acesso de gerente.'), 400
    db().execute('update users set status=?, cargo=? where id=?', (d['status'], d['cargo'], uid))
    db().commit()
    return jsonify(ok=True)


# ---------- produtos ----------
def row_prod(r):
    return {k: r[k] for k in ('id', 'nome', 'categoria', 'embalagem')}


@app.get('/api/produtos')
@need('approved')
def list_produtos():
    return jsonify([row_prod(r) for r in db().execute('select * from produtos order by nome')])


@app.post('/api/produtos')
@need('admin')
def add_produtos():
    d = request.get_json(force=True, silent=True)
    for p in (d if isinstance(d, list) else [d or {}]):
        if not all(str(p.get(k, '')).strip() for k in ('nome', 'categoria', 'embalagem')):
            return jsonify(erro='Preencha produto, categoria e embalagem.'), 400
        db().execute('insert into produtos values (?,?,?,?)', (uuid.uuid4().hex, p['nome'].strip(), p['categoria'].strip(), p['embalagem'].strip()))
    db().commit()
    return jsonify(ok=True), 201


@app.put('/api/produtos/<pid>')
@need('admin')
def edit_produto(pid):
    p = request.get_json(force=True, silent=True) or {}
    db().execute('update produtos set nome=?, categoria=?, embalagem=? where id=?', (p.get('nome'), p.get('categoria'), p.get('embalagem'), pid))
    db().commit()
    return jsonify(ok=True)


@app.delete('/api/produtos/<pid>')
@need('admin')
def del_produto(pid):
    db().execute('delete from produtos where id=?', (pid,))
    db().commit()
    return jsonify(ok=True)


# ---------- ordens de produção (lotes) ----------
@app.get('/api/ops')
@need('approved')
def list_ops():
    return jsonify([json.loads(r['data']) for r in db().execute('select data from ops order by id_op')])


@app.get('/api/ops/<oid>')
@need('approved')
def get_op(oid):
    r = db().execute('select data from ops where id_op=?', (oid,)).fetchone()
    return (jsonify(json.loads(r['data'])), 200) if r else (jsonify(erro='Lote não encontrado.'), 404)


def save_op(op):
    db().execute('insert into ops values (?,?,?) on conflict(id_op) do update set data=excluded.data, updated_at=excluded.updated_at',
                 (op['id_op'], json.dumps(op, ensure_ascii=False), now()))


@app.put('/api/ops/<oid>')
@need('approved')
def put_op(oid):
    op = request.get_json(force=True, silent=True) or {}
    op['id_op'] = oid
    save_op(op)
    db().commit()
    return jsonify(ok=True)


@app.post('/api/ops/bulk')
@need('approved')
def bulk_ops():
    for op in request.get_json(force=True, silent=True) or []:
        save_op(op)
    db().commit()
    return jsonify(ok=True), 201


# ---------- notificações ----------
@app.get('/api/notificacoes')
@need('approved')
def list_notif():
    rows = db().execute('select * from notificacoes order by created_at desc limit 100').fetchall()
    return jsonify([{k: r[k] for k in ('id', 'mensagem', 'usuario', 'created_at')} for r in rows])


@app.post('/api/notificacoes')
@need('approved')
def add_notif():
    msg = str((request.get_json(force=True, silent=True) or {}).get('mensagem', '')).strip()
    if not msg:
        return jsonify(erro='Mensagem vazia.'), 400
    n = {'id': uuid.uuid4().hex, 'mensagem': msg, 'usuario': g.user['nome'], 'created_at': now()}
    db().execute('insert into notificacoes values (?,?,?,?)', (n['id'], n['mensagem'], n['usuario'], n['created_at']))
    db().commit()
    return jsonify(n), 201


# ---------- site (React compilado em ../dist) ----------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def site(path):
    if path.startswith('api/'):
        return jsonify(erro='Rota não encontrada.'), 404
    full = os.path.join(DIST, path)
    if path and os.path.isfile(full):
        return send_from_directory(DIST, path)
    if os.path.isfile(os.path.join(DIST, 'index.html')):
        return send_from_directory(DIST, 'index.html')
    return 'Frontend não compilado. Rode "npm run build" na pasta do projeto.', 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
