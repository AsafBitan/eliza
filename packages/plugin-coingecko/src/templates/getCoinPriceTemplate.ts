export const getCoinPriceTemplate = `Extract the crypto coin and the curency from the {{userName}} message.
The message is the most recent message.
The coin id is the id of the coin in the coingecko api.
Respond with a JSON object containing the crypto coin id and the curency in lowercase.
Only respond with the coin id and the curency, do not include any other text.
If the coin is a cryptocurrency ticker symbol, respond with the coin id.
If no specific coin is provided, respond with an error.
If no specific curency is provided, defualt it to be 'usd'.
If you didnt andersand the message, respond with an error.

The response must include:
- coinId: The coin id
- currency: The currency

Example response:
\`\`\`json
{
    "coinId": "bitcoin",
    "currency": "usd"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
Extract the coin id and the curency from the most recent message.
Respond with a JSON markdown block containing both coinId and currency.`;




