# Registro de imagens dos profissionais

Fonte extraida de `paginas/profissionais.html` e `style.css`.

## Espaco de imagem

- Seletor: `.professional-avatar`
- Dimensoes CSS: `width: 110px; height: 110px`
- Proporcao do prompt: `1:1`
- Formato visual: circular (`border-radius: 999px`)
- Ajuste de imagem: `object-fit: cover; object-position: center top;`

## Container responsivo dos cards

- Grid: `.professionals-grid`
- Desktop: `repeat(auto-fit, minmax(280px, 1fr))`, `gap: 2rem`
- Conteudo maximo do container: `1160px` (container de `1200px` com padding lateral de `20px`)
- Card em desktop largo: aproximadamente `365.33px` de largura em 3 colunas
- Card minimo pela grid: `280px`
- Mobile ate `768px`: grid em 1 coluna (`grid-template-columns: 1fr`)
- Card em 480px de viewport: aproximadamente `400px` de largura
- Card em 320px de viewport: aproximadamente `240px` de largura, sem overflow por causa da regra mobile
- Altura do card: automatica, definida pelo conteudo

## Cards

| Arquivo | Titulo | Nome | Especialidade | Imagem gerada | Dimensao do arquivo |
| --- | --- | --- | --- | --- | --- |
| `carlos-silva.jpg` | Dr. | Carlos Silva | Clinico Geral | medico, jaleco branco, peito para cima | 512x512 |
| `marina-costa.jpg` | Dra. | Marina Costa | Cardiologista | medica, jaleco branco, peito para cima | 512x512 |
| `fernando-oliveira.jpg` | Dr. | Fernando Oliveira | Dentista | medico, jaleco branco, peito para cima | 512x512 |
| `ana-paula.jpg` | Dra. | Ana Paula | Fisioterapeuta | medica, jaleco branco, peito para cima | 512x512 |
| `roberto-santos.jpg` | Dr. | Roberto Santos | Dermatologista | medico, jaleco branco, peito para cima | 512x512 |
| `juliana-martins.jpg` | Dra. | Juliana Martins | Nutricionista | medica, jaleco branco, peito para cima | 512x512 |

Nao houve nome ambiguo: todos os cards ja usam `Dr.` ou `Dra.`.
