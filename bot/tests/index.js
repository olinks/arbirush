// Import the required packages
const { expect, request } = require("chai");
const ethers = require("ethers");

// Define the test suite
describe("Rush Lottery Bot Testing", function () {
  describe("Unit tests for randomGen function", function () {
    it("randomGen should return a number between 1 and 10", function () {
      const randNum = randomGen(10);
      expect(randNum).toBeGreaterThanOrEqual(1);
      expect(randNum).toBeLessThanOrEqual(10);
    });
  });
  describe("Unit tests for checkWinner function", function () {
    it("checkWinner should return true when passed the correct number", function () {
      const num = 5;
      const result = checkWinner(num);
      expect(result).toBe(true);
    });

    it("checkWinner should return false when passed the wrong number", function () {
      const num = 8;
      const result = checkWinner(num);
      expect(result).toBe(false);
    });
  });
  describe("Integration tests for contract event listener", function () {
    it("contract event listener should be able to detect a token transfer", async function () {
      const provider = new ethers.providers.JsonRpcProvider();
      const signer = provider.getSigner();
      const arbiRushContract = new ethers.Contract(
        arbiRushAddress,
        arbirushABI,
        signer
      );

      const listenerPromise = new Promise((resolve) => {
        contract.on("Transfer", (from, to, value, event) => {
          resolve({ from, to, value, event });
        });
      });

      // Transfer tokens to the contract address
      const value = ethers.utils.parseUnits("1", 18);
      await arbiRushContract.transfer(arbiRushAddress, value);

      // Wait for the listener to be called
      const result = await listenerPromise;

      expect(result.from).toBe(signer.getAddress());
      expect(result.to).toBe(arbiRushAddress);
      expect(result.value.toString()).toBe(value.toString());
    });
  });
  describe("Integration tests for sending message to Telegram bot", function () {
    it("sendToBot should be able to send message to Telegram bot", async function () {
      const data = {
        winner: true,
        eth_value: 10,
        usd_value: 100,
        from: 1000,
        to: 1100,
        value: 2000,
        lottery_percentage: 1,
        no_rush: 10,
        marketcap: 10000,
        buyer_address: "0x123456789abcdef",
        transaction_hash: "0x987654321fedcba",
      };

      // Mock axios.post method to simulate sending message to Telegram bot
      axios.post = jest.fn().mockResolvedValue({});

      await sendToBot(data);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    it("should send a message to Telegram", function (done) {
      request("https://api.telegram.org")
        .post("/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage")
        .set("content-type", "application/json")
        .send({
          chat_id: 123456,
          text: "Test message from Mocha/Chai",
        })
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("ok").to.equal(true);
          done();
        });
    });
  });
});
