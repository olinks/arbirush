const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const runApp = async () => {
  await Moralis.start({
    apiKey: "YOUR_API_KEY",
    // ...and any other configuration
  });

  const address = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";

  const chain = EvmChain.ARBITRUM;

  const response = await Moralis.EvmApi.token.getTokenPrice({
    address,
    chain,
  });

  console.log(response.toJSON());
};

runApp();