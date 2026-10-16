# Identificação aproximada pelo mapa cadastral

O site tenta Google e a consulta principal de rua/cidade. Se Barra do Garças foi identificada e o bairro está ausente, seleciona a referência de bairro mais próxima extraída do PDF fornecido pela loja. Não precisa da API Google para essa alternativa.

Os pontos representam posições dos nomes de bairros/loteamentos no desenho, alinhadas às coordenadas das ruas. Não são limites oficiais nem centros geográficos validados. O critério de referência próxima foi autorizado pela loja. Distância máxima: 1.200 metros da referência. Não determina o município: a cidade deve ser identificada pela consulta de endereço. Não substitui bairro já retornado por um serviço.

A taxa é calculada normalmente pelo nome selecionado. O cadastro contém as variantes de nomes que correspondem diretamente à lista gratuita, incluindo Sena Marques, Nova Barra, Palmares e Jardim dos Ipês. Bairros não presentes no mapa não foram inventados. Aragarças e Pontal continuam sem exigência de bairro.

Alinhamento preliminar: 150 rótulos de ruas para ajuste e 38 separados para comparação. Distância mediana do ponto do rótulo até o trecho de rua correspondente: 30,6m. Percentil 90: 463,5m. Esses valores NÃO medem acerto do bairro nem erro de uma fronteira; podem incluir diferenças de cadastro e homônimos.

Não foram extraídos polígonos oficiais: a conversão do DWG falhou. Perto de divisas, a aproximação pode escolher outro bairro e alterar a taxa. Use revisao-bairros.html para conferir as referências e teste endereços conhecidos. Não há garantia de cobertura ou identificação correta em toda a cidade.

Atualize index.html, script.js, bairros-referencia.js e assets/entrega. Os arquivos de diagnóstico não são necessários para a automação Windows.
