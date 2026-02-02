# ATA Addon Template Generator

Gerador local (site) que cria um .zip do template do addon, substituindo placeholders e gerando UUIDs novos.

## Como rodar

1. Instale Node.js 18+ (recomendado 20+)
2. No terminal, dentro desta pasta:

```bash
npm i
npm start
```

3. Abra: http://localhost:3000

## O que ele faz

- Substitui `rc_ADDONACRONYM` -> `rc_<addonAcronym>`
- Substitui `Addon Name`/`Nome Do Addon` -> nome do addon
- Substitui `CREATOR_ACRONYM` -> creator acronym
- Substitui `Purplebyte` -> creator
- Renomeia arquivos/pastas que usam `rc_ADDONACRONYM`
- Renomeia `CREATOR_triggers.js` -> `<creatorAcronym>_triggers.js`
- Gera UUIDs novos para BP e RP e mantém dependências BP↔RP conectadas
- Preserva diretórios vazios no zip (entradas de diretório)
