# Multiperfil Live (protótipo SENAI 2026)

Fluxo por perfil com reconhecimento facial: 1 Qualidade → 2 Verificação → 3 Envase → 4 Laboratório.
O Gerente vê tudo (dashboards de atrasos e custos, equipe, produtos).

**Sem serviços pagos:** backend em Python (Flask) + banco SQLite (um arquivo, `backend/data/multiperfil.db`, criado sozinho). O reconhecimento facial roda no navegador.

## Novidades da V2.1
- **Logo discreta:** removidas as faixas/barras grandes do topo e do rodapé. A logo Majuth Flow agora aparece pequena e translúcida no canto inferior direito, como uma assinatura de copyright.
- **Azul marinho nos botões:** botões e destaques que eram vermelhos agora usam o azul marinho (`marinho` em `tailwind.config.js`), combinando com a logotipo da Multiperfil. Vermelho ficou só em alertas (reprovado, excluir, perdas).
- **Barra lateral AeroGlass:** textos alinhados à esquerda em uma linha, contadores em pílulas de vidro no canto direito (sem ficar em cima das palavras) e item ativo com brilho de vidro.
- Estrutura do site, fluxo, backend e banco continuam iguais à V2. Lembre de rodar `npm run build` antes de subir o servidor.

## Novidades da V2
- **Nova identidade visual:** paleta Majuth Flow aplicada em toda a interface e nos PDFs: vermelho `#C9031A`, vinho `#9D1722`, marrom `#4A2723`, turquesa `#07A2A6` e creme `#FFECCB`. Fundo creme, textos em marrom, botões principais em vermelho/vinho, destaques e "Concluído" em turquesa.
- Somente cores e estilos mudaram. Telas, fluxo, backend, banco e regras continuam exatamente como na V1.7 Beta.
- As cores ficam em `tailwind.config.js` (nomes `vermelho`, `vinho`, `cacau`, `turquesa`, `creme`) e em `src/index.css`.

## Novidades da V1.7 Beta
- **Envase simplificado:** o operador só toca em *Iniciar envase* e, ao terminar, em *Finalizar envase*. Dia, hora e minuto de início e fim são gravados automaticamente. Quantidade envasada, peso total (kg), misturador, bomba, tempo parado e checklist são preenchidos só depois de finalizar.
- **Login por ID facial:** botão *Entrar com ID facial* na tela de login. O servidor compara o rosto com os cadastrados (contas aprovadas) e a pessoa entra direto no seu setor. Rota nova: `POST /api/auth/face-login`; limite ajustável pela variável `FACE_LIMITE` (padrão 0.5).
- **Importante:** a pasta `dist` não vem neste zip. Rode `npm install` e `npm run build` antes de subir o servidor.

## Rodar no seu computador
```
# 1) site (obrigatório na V2: gera a pasta dist)
npm install
npm run build

# 2) servidor Python
cd backend
pip install -r requirements.txt
python app.py            # abre em http://localhost:5000
```
Primeiro gerente: cadastre-se com o e-mail **admin@multiperfil.com** (ou defina `ADMIN_EMAIL` antes de rodar). Esse e-mail já entra como Gerente aprovado. Os demais criam conta, cadastram o rosto e o gerente aprova na aba **Equipe**.

Para desenvolver com recarga automática: `python backend/app.py` num terminal e `npm run dev` em outro (http://localhost:5173).

## Hospedar de graça
- **PythonAnywhere (recomendado: os dados ficam salvos)**: conta gratuita → Web → Add a new web app → Flask (manual configuration) → envie o projeto (com a pasta `dist`) → no arquivo WSGI: `from app import app as application` (com o caminho `.../project/backend`) → `pip install flask` no console Bash → defina `ADMIN_EMAIL` no WSGI (`os.environ[...]`) → Reload. A conta gratuita pede um clique de renovação a cada 3 meses.
- **Render (Web Service gratuito)**: Build `pip install -r backend/requirements.txt`, Start `gunicorn --chdir backend app:app`. **Atenção:** no plano gratuito o disco é temporário, então o banco volta ao zero quando o serviço reinicia ou é publicado de novo, e o serviço "dorme" após 15 min sem uso. Serve para demonstração, não para guardar dados.
- A câmera exige HTTPS (as duas opções dão) ou localhost.

## Observações
- Guardamos a assinatura numérica do rosto e uma miniatura, com consentimento no cadastro.
- Protótipo: sem detecção de prova de vida. Senhas ficam com hash no banco.
- Se o rosto não confere (4 tentativas): ACESSO NEGADO, a etapa não inicia e o evento vai para as notificações.
- Cada lote no Envase tem um QR Code que abre `#/lote/OP-XXXX` (acompanhamento ao vivo). O QR usa o endereço do site, então só funciona em outros aparelhos depois de hospedado.
