# Checklist de Testes Front-end

## Módulo: Autenticação (Login & Registro)
- [ x] **Renderização base:** UI carrega aplicando estilos do Tailwind v4 (cores e inputs). Ícones do `lucide-react` visíveis.
- [ ] **Alternância de Estado:** Troca entre tela de Login e Registro limpa os erros anteriores.
- [ ] **Validação HTML5:** Tentar submeter form vazio ou senha com menos de 6 caracteres aciona os bloqueios nativos do input.
- [ ] **Tratamento de Erro API:** Inserir e-mail não cadastrado/senha incorreta exibe banner vermelho com a mensagem do back-end, sem quebrar o layout.
- [ ] **Estado de Loading:** Botão desabilita e exibe spinner do `lucide-react` durante a requisição, prevenindo double-submit.
- [x ] **Sucesso (Login):** Credenciais válidas disparam redirecionamento automático pela role.
- [ ] **Sucesso (Registro):** Seleção de papel (Cliente/Organizador) visualmente clara; submissão cria usuário e loga automaticamente.