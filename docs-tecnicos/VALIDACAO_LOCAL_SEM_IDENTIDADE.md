# Validação local sem identidade pessoal

## Escopo

A seção **Revisão do auditor** está disponível nos detalhes dos 73 critérios. Ela funciona inteiramente no navegador e não usa banco, API de escrita, conta de usuário ou token do GitHub.

Nenhum formulário ou JSON de revisão possui campo para nome, matrícula, e-mail, login, assinatura ou identificador de pessoa. O registro contém somente IDs técnicos de critério, diagnóstico, execução e revisão, data/hora, parecer, justificativa, estado, confirmação do checkbox e autodeclaração de revisão independente.

## Estados separados

- **Pendente de revisão:** nenhum evento local conclusivo.
- **Revisado sem conclusão:** rascunho salvo; não produz resultado oficial.
- **Validado:** checkbox marcado explicitamente, parecer selecionado e verificações metodológicas satisfeitas.
- **Reaberto:** validação anterior preservada no histórico e novo evento com motivo.
- **Conflito pendente:** duas versões divergentes foram preservadas e exigem escolha explícita na consolidação.

“Validado” descreve uma ação local declarada. Não comprova identidade, assinatura digital ou homologação institucional. Um critério validado pode resultar em `Não atendido`.

## Bloqueios metodológicos

A conclusão exige diagnóstico visualizado, evidência disponível, parecer, justificativa quando necessária e declaração independente. Quando uma primeira busca não localizou a informação, a conclusão fica bloqueada até a segunda verificação em outra data. Ainda é possível salvar `Revisado sem conclusão`.

## Persistência e compartilhamento

O namespace local é `sema-transparencia:revisoes:v1`. O estado persiste após recarregar a página no mesmo navegador, mas não sincroniza entre computadores ou navegadores.

O botão **Exportar validações** gera um JSON versionado com SHA-256. **Importar JSON** valida schema, hash e IDs da matriz; registros divergentes são preservados e sinalizados como conflito, sem sobrescrita silenciosa.

Consolidação local:

```powershell
npm.cmd run merge:reviews -- --input C:\caminho\validacoes-sema.json
```

Em conflito, a escolha explícita usa um ID técnico de revisão:

```powershell
npm.cmd run merge:reviews -- --input C:\caminho\validacoes-sema.json --resolve Q1.1.2=rev-id-escolhido
```

O conteúdo consolidado fica em `data/validacoes/`, ignorado pelo Git. Para gerar o snapshot compartilhado, cada revisão precisa ser indicada expressamente:

```powershell
npm.cmd run publish:reviews -- --revision rev-id-autorizado
```

O clique no site público nunca grava no GitHub nem modifica o deploy da Vercel. Somente a consolidação, o commit e um novo deploy propagam resultados compartilhados.
