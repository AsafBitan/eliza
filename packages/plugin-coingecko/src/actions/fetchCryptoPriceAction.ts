import {
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    type Action,
    ModelClass,
    composeContext,
    generateMessageResponse,
    getEmbeddingZeroVector,
    elizaLogger,
    generateText,
} from "@elizaos/core";
import { getCoinPriceTemplate } from "../templates/getCoinPriceTemplate";

// If you have a pro account, you can use this url: 'https://pro-api.coingecko.com/api/v3/search'
async function getCoinId(coin: string){
    try{
        const url = 'https://api.coingecko.com/api/v3/search'
        const apiKey = process.env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}` : '';
        const response = await fetch(`${url}?query=${coin}`, {
            method: "GET",
            headers: {
                'accept': 'application/json',
                'x_cg_demo_api_key': apiKey
            }
        });

        if (!response.ok) {
            console.error(`Error: Received HTTP status ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || !data.coins || data.coins.length === 0) {
            console.error(`Couldn't find the coinId for the coin "${coin}".`);
            return null;
        }

        // Find the first coin with a matching name or symbol
        const coinId = data.coins[0]?.id;
        if (!coinId) {
            console.error(`No coinId found for the coin "${coin}".`);
            return null;
        }

        return coinId;

    } catch (error) {
        console.error('Error fetching coinId:', error);
        return null;
    }
}
// If you have a pro account, you can use this url: 'https://pro-api.coingecko.com/api/v3/simple/price'
async function getCoinPrice(coin: string, currency: string = 'usd') {

    const baseUrl = 'https://api.coingecko.com/api/v3/simple/price';
    const apiKey = process.env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}` : '';
    const url = `${baseUrl}?ids=${coin}&vs_currencies=${currency}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x_cg_demo_api_key': apiKey
            },
        });

        if (!response.ok) {
            console.error(`Error: Received HTTP status ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return `Couldn't find the price for the coin ${coin} in ${currency}`;
        }

        const price = data[coin]?.[currency];

        if (!price) {
            console.error(`Couldn't find the price for the coin "${coin}" in currency "${currency}".`);
            return null;
        }

        return price;

    } catch (error) {
        console.error('Error fetching price:', error);
        return null;
    }
}

export const fetchCryptoPriceAction: Action = {
    name: "fetchCryptoPriceAction",
    similes: [
        "GET_CRYPTO_PRICE",
        "FETCH_ASSET_PRICE",
        "QUERY_CRYPTO_PRICE",
        "CHECK_CRYPTO_VALUE",
        "RETRIEVE_CRYPTO_PRICE",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return (
            !!(
                runtime.getSetting("COINGECKO_API_KEY") ??
                process.env.COINGECKO_API_KEY
            )
        );
    },
    description:
        "Get the current price of a given cryptocurrency in a specific currency.",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: any,
        _callback: HandlerCallback
    ): Promise<boolean> => {

        try{
            // Initialize/update state
        if (!_state) {
            _state = (await _runtime.composeState(_message)) as State;
        }
        _state = await _runtime.updateRecentMessageState(_state);

        const coinContext = composeContext({
            state: _state,
            template: getCoinPriceTemplate,
        })

        const content = await generateMessageResponse({
            runtime: _runtime,
            context: coinContext,
            modelClass: ModelClass.SMALL,
        })

        const hasCoinData = content?.coinId && content?.currency && !content?.error;

        if (!hasCoinData) {
            _callback({text: "Couldn't find the price"});
            return false;
        }

        const coinIdFromCoinGecko = await getCoinId(String(content.coinId));

        const coineprice = await getCoinPrice(String(coinIdFromCoinGecko), String(content.currency));

        const formattedPrice = coineprice ? coineprice.toLocaleString() : null;

        const currentTime = new Date().toLocaleTimeString();

       // Construct the response
        const responseText = coineprice
            ? `As of ${currentTime}, The current price of ${coinIdFromCoinGecko} is ${formattedPrice} ${content.currency}`
            : `Couldn't find the price for the coin ${content.coinId} in ${content.currency}`;

        const newMemory: Memory = {
            userId: _message.agentId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: responseText,
                action: "fetchCryptoPriceAction",
            },
            createdAt: new Date().getTime(),
            embedding: getEmbeddingZeroVector(),
        };

        await _runtime.messageManager.createMemory(newMemory);
//Sorry, something went wrong. Please try again.

        _callback({
            text: responseText,
            content: {
                coineprice,
                content,},
            memory: newMemory.content,
        });

        return true;
        } catch (error) {
            console.error('Error in handler:', error);
            _callback({ text: "Sorry, something went wrong. Please try again." });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "How much does BTC cost?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of BTC from CoinGecko. One moment...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "How much does Solana cost in USD?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Solana in USD from CoinGecko. One moment...",
                    action: "GET_CRYPTO_PRICE",
                },
            },

        ],
        [
            {
                user: "{{user1}}",
                content: { text: "price ethereum" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me get the price of Ethereum from CoinGecko for you. Give me a minute...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "fetch bitcoin price in EUR" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Getting the price of Bitcoin from CoinGecko now. One moment please...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "check the value of litecoin" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Getting the price of Litecoin from CoinGecko now. One moment please...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "retrieve the price of ripple" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me get the price of Ripple from CoinGecko for you. Give me a minute...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "get the price of dogecoin" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Dogecoin from CoinGecko. One moment...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "whats the price of solana" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Fetching the current price of Solana from CoinGecko. One moment...",
                    action: "GET_CRYPTO_PRICE",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
