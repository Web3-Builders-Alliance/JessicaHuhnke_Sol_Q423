import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');
const bundlrUploader = createBundlrUploader(umi);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://arweave.net/llEc8voliQZC0KvZzTHm1GduUm_AoqIQ_zktqPNy4eY"
        const metadata = {
            name: "Jessica's Generug",
            symbol: "RUG",
            description: "Super rare ruggy boi",
            image:image,
            attributes: [
                {trait_type: 'Background', value: 'Teal'}, 
                {trait_type: 'Pattern', value: 'Rare'},
                {trait_type: 'Frills', value: 'Super Duper Rare'},
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "?"
                    },
                ]
            },
            creators: []
        };
        const myUri = await bundlrUploader.uploadJson(metadata);
        console.log("Your image URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();