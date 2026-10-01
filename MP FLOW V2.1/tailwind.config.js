/** @type {import('tailwindcss').Config} */
// Paleta Majuth Flow V2: #C9031A (vermelho), #9D1722 (vinho), #4A2723 (cacau),
// #07A2A6 (turquesa), #FFECCB (creme). V2.1: azul marinho (#1B3F73) nos botões.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vermelho: {
          50: '#FFF1F2', 100: '#FFE0E3', 200: '#FDBFC6', 300: '#F58C98', 400: '#E5485B',
          500: '#D91E36', 600: '#C9031A', 700: '#9D1722', 800: '#7A1119', 900: '#4A2723',
        },
        vinho: {
          50: '#FBEFF0', 100: '#F5D9DB', 200: '#EAB0B5', 300: '#D9747D', 400: '#BC3A46',
          500: '#A81F2B', 600: '#9D1722', 700: '#7F121B', 800: '#620E15', 900: '#4A2723',
        },
        cacau: {
          50: '#FAF4F2', 100: '#F1E4E0', 200: '#E0C8C1', 300: '#C4A096', 400: '#9C746A',
          500: '#744740', 600: '#5E352F', 700: '#4A2723', 800: '#381C19', 900: '#2A1412',
        },
        // azul marinho (identidade Multiperfil) - botões e destaques
        marinho: {
          50: '#F0F4FA', 100: '#DCE6F4', 200: '#B8CBE6', 300: '#8AA8D3', 400: '#5A80B8',
          500: '#2F5A9A', 600: '#1B3F73', 700: '#143260', 800: '#0E2549', 900: '#081833',
        },
        turquesa: {
          50: '#E8F8F8', 100: '#C8EEEF', 200: '#94DCDE', 300: '#5CC6C9', 400: '#2FB3B7',
          500: '#07A2A6', 600: '#068589', 700: '#056A6D', 800: '#045154', 900: '#033A3C',
        },
        creme: {
          50: '#FFFBF4', 100: '#FFF7E8', 200: '#FFECCB', 300: '#F7DDAE', 400: '#EAC987',
          500: '#D9B068',
        },
        // neutros quentes (substituem o cinza azulado padrão; tom base = cacau)
        slate: {
          50: '#FBF7F2', 100: '#F4EBE1', 200: '#E8D9C8', 300: '#D3BFAA', 400: '#A58E80',
          500: '#7C625A', 600: '#664842', 700: '#563430', 800: '#4A2723', 900: '#2E1612',
        },
        // vermelho/rosa de alerta seguem a família da marca
        rose: {
          50: '#FFF1F2', 100: '#FFE0E3', 200: '#FDBFC6', 300: '#F58C98', 400: '#E5485B',
          500: '#C9031A', 600: '#9D1722', 700: '#7F121B', 800: '#620E15', 900: '#4A2723',
        },
        red: {
          50: '#FFF1F2', 100: '#FFE0E3', 200: '#FDBFC6', 300: '#F58C98', 400: '#E5485B',
          500: '#C9031A', 600: '#9D1722', 700: '#7F121B', 800: '#620E15', 900: '#4A2723',
        },
      },
    },
  },
  plugins: [],
};
