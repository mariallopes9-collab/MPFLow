export interface Produto { id: string; nome: string; categoria: string; embalagem: string }

// Pré-produtos importados do Excel (colunas: Produto, Categoria, Embalagem / Apresentação)
export const PRODUTOS_EXCEL: Omit<Produto, 'id'>[] = [
  { nome: "Massa de Rejunte para Drywall", categoria: "Massas e niveladores", embalagem: "Baldes 6 kg / 14 kg / 25 kg" },
  { nome: "Massa Cimentícia", categoria: "Massas e niveladores", embalagem: "Baldes 3,6 L (5 kg) / 10 L (14 kg)" },
  { nome: "Massa Acrílica", categoria: "Massas e niveladores", embalagem: "Baldes 18 L / 25 kg" },
  { nome: "Textura Acrílica", categoria: "Tintas e revestimentos", embalagem: "Balde 25 kg" },
  { nome: "Massa Corrida", categoria: "Massas e niveladores", embalagem: "Baldes 5 kg / 25 kg" },
  { nome: "Multichapisco", categoria: "Adesivos e preparação", embalagem: "Baldes 3,6 L / 18 L" },
  { nome: "Tinta Dupla Ação", categoria: "Tintas e revestimentos", embalagem: "Baldes 3,6 L / 18 L" },
  { nome: "Resina Acrílica", categoria: "Tintas e revestimentos", embalagem: "Balde 3,6 L" },
  { nome: "Tinta Multi Interiores", categoria: "Tintas e revestimentos", embalagem: "Baldes 3,6 L / 18 L" },
  { nome: "Tinta Casa Flex", categoria: "Tintas e revestimentos", embalagem: "Baldes 3,6 L / 18 L" },
  { nome: "Cimento Queimado", categoria: "Massas e niveladores", embalagem: "Balde 3,6 L (5 kg)" },
  { nome: "Cola Multiperfil", categoria: "Adesivos e preparação", embalagem: "Balde 1,5 kg" },
  { nome: "Tampa Tudo", categoria: "Adesivos e preparação", embalagem: "Potes 90 g / 340 g" },
  { nome: "Fundo Preparador", categoria: "Adesivos e preparação", embalagem: "Baldes 18 L" },
  { nome: "Massa de Rejunte para Drywall na Caixa", categoria: "Massas e niveladores", embalagem: "Caixa 18 kg" },
];
