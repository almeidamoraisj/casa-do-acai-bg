# Ativar o endereço pelo Google Maps

No teste desta atualização, o Google retornou REQUEST_DENIED: faturamento não habilitado.

1. No Google Cloud, selecione o projeto da chave e vincule uma conta de faturamento.
2. Ative Maps JavaScript API e Geocoding API nesse mesmo projeto.
3. Restrinja a chave por sites (referenciadores HTTP): https://almeidamoraisj.github.io/* e apenas aos serviços usados.
4. Configure limites de cota e alertas de uso no projeto.
5. Publique index.html, script.js, google-maps-config.js e assets/copos/verao.webp.

A chave de navegador está em google-maps-config.js, como exigido pelo SDK. Não use esta configuração para chaves de servidor. O cliente autoriza a localização e o site consulta rua, bairro e cidade. O código considera neighborhood e sublocality nos resultados do mesmo município. Os serviços anteriores ficam como alternativa. Para Aragarças/Pontal, o bairro é opcional. Em Barra, ele determina a taxa.

Não foi possível validar o endereço real no Google enquanto o faturamento estiver desativado. Teste no celular após habilitar.
