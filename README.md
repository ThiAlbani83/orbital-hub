# Dynamic Security Orb

Widget quadrado animado para exibir servicos da empresa em camadas concentricas.

## Rodar local

```bash
cd "/Users/security/Documents/New project"
npm start
```

Abrir: `http://localhost:3000`

## Personalizar servicos

Edite o array `servicesRings` em:

- `/Users/security/Documents/New project/public/app.js`

## Embed no seu site

### Opcao 1: iframe

```html
<iframe
  src="https://seu-dominio.com/security-orb/"
  title="Servicos de seguranca"
  style="width:100%;max-width:900px;aspect-ratio:1/1;border:0;border-radius:20px;overflow:hidden;"
  loading="lazy"
></iframe>
```

### Opcao 2: arquivos diretos

Copie os arquivos abaixo para seu projeto web e sirva em uma rota dedicada:

- `/Users/security/Documents/New project/public/index.html`
- `/Users/security/Documents/New project/public/styles.css`
- `/Users/security/Documents/New project/public/app.js`

## Observacoes

- Animacao respeita `prefers-reduced-motion`.
- Design responsivo para desktop e mobile.
