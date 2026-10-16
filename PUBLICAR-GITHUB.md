# Publicação do cardápio estático

Diagnóstico: o repositório contém o campo de troco e a identificação local de bairro, mas o site ainda serve a versão antiga. A publicação examinada falhou na etapa Build with Jekyll ao processar node_modules.

1. Extraia o ZIP na pasta do repositório no computador. Os arquivos do site estão diretamente na raiz.
2. Confira no GitHub Desktop se index.html, style.css, script.js, bairros-referencia.js e .nojekyll estão incluídos nas alterações. O arquivo .nojekyll é vazio: isso é correto.
3. Faça Commit e Push origin.
4. Espere a publicação em Actions finalizar com sucesso. Se estiver vermelha, o site continua antigo; confira o erro dessa execução.
5. Abra o site em uma aba anônima para testar Dinheiro e localização.

.nojekyll desativa o processamento do Jekyll para este site estático publicado a partir de uma branch. Se existir um workflow personalizado que chama jekyll-build-pages explicitamente, ele precisa ser alterado separadamente. A pasta automacao-windows pertence ao computador da loja; não precisa ser enviada ao GitHub. Não envie node_modules, sessões ou dados de pedidos.

A barra do carrinho tem largura min(460px, tela menos 24px), com quantidade, valor e Ver pedido sem quebras. O troco aparece somente para Dinheiro. A referência do mapa cadastral é aproximada e usada apenas quando falta bairro e a cidade foi reconhecida como Barra do Garças.
