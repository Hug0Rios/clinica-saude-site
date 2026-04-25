# Clínica Vitalis - Website

Um site moderno e responsivo para uma clínica de saúde, desenvolvido com HTML, CSS e JavaScript puro. Perfeito para apresentação e gerenciamento de informações da clínica.

## 🎯 Características

- **Página Inicial (Home)**: Apresentação visual da clínica com chamada para ação
- **Sobre a Clínica**: Informações sobre a instituição, missão e diferenciais
- **Profissionais**: Galeria com informações de pelo menos 6 profissionais
- **Serviços**: Listagem detalhada de serviços e especialidades
- **Contato/Agendamento**: Formulário para agendamento de consultas e informações de contato
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e smartphone
- **Menu Mobile**: Navegação otimizada para dispositivos móveis

## 📱 Responsividade

O site é completamente responsivo e se adapta a:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🚀 Como Usar

### 1. Visualizar Localmente

Simplesmente abra o arquivo `index.html` em seu navegador:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Ou use um servidor local:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (com http-server)
npx http-server
```

### 2. Estrutura de Arquivos

```
clinica-saude-site/
├── index.html        # Página principal
├── style.css         # Estilos do site
├── script.js         # Funcionalidades JavaScript
└── README.md         # Este arquivo
```

## 🎨 Cores e Design

- **Cor Primária**: Verde `#00a86b` (saúde e bem-estar)
- **Cor Secundária**: Azul escuro `#2c3e50` (profissionalismo)
- **Fundo Claro**: `#f8f9fa` (leveza)

## 📋 Seções do Site

### Home
- Título e descrição da clínica
- Botões de call-to-action
- Destaque dos principais serviços

### Sobre
- Apresentação da clínica
- Missão da instituição
- Diferenciais competitivos

### Profissionais
- Grid com 6+ profissionais
- Nome, foto (avatar), especialidade e descrição
- Cards interativos com hover effects

### Serviços
- Listagem de especialidades
- Descrição detalhada de cada serviço
- Ícones representativos

### Contato
- Formulário de agendamento
- Informações de endereço
- Telefone e WhatsApp
- Horário de funcionamento

## 🛠️ Funcionalidades JavaScript

- ✅ Menu mobile responsivo com hamburger
- ✅ Navegação suave entre seções
- ✅ Formulário de agendamento interativo
- ✅ Validação de campos
- ✅ Animações ao scroll
- ✅ Efeitos de hover nos cards

## 📝 Customização

### Modificar Informações da Clínica

Edite o arquivo `index.html` para:
- Mudar o nome da clínica
- Adicionar/remover profissionais
- Alterar serviços oferecidos
- Atualizar informações de contato

### Personalizar Cores

No arquivo `style.css`, altere as variáveis:

```css
:root {
    --primary-color: #00a86b;      /* Cor principal */
    --secondary-color: #2c3e50;    /* Cor secundária */
    --text-color: #333;            /* Cor do texto */
    --light-bg: #f8f9fa;          /* Fundo claro */
    --white: #ffffff;              /* Branco */
}
```

## 🌐 Deploy

### GitHub Pages

1. Faça push do repositório para GitHub
2. Vá em Settings → Pages
3. Selecione `main` como branch
4. O site estará disponível em `https://seu-usuario.github.io/clinica-saude-site`

### Netlify

1. Conecte seu repositório GitHub
2. Configure o build e deploy
3. Seu site estará online em minutos

## 💡 Dicas de Melhorias Futuras

- Integrar backend para gerenciar agendamentos
- Adicionar sistema de login para pacientes
- Implementar SMS/Email para confirmações
- Adicionar galeria de fotos da clínica
- Blog com dicas de saúde
- Chat em tempo real com atendimento
- Sistema de avaliações de pacientes
- Integração com planos de saúde

## 📄 Licença

Este projeto é fornecido como base para desenvolvimento. Sinta-se livre para usar e modificar conforme necessário.

## 👨‍💻 Desenvolvido com

- HTML5
- CSS3 (com variáveis e responsividade)
- JavaScript (puro, sem frameworks)

---

**Desenvolvido com ❤️ para a Clínica Vitalis**
