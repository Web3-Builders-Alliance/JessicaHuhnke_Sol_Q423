import { PublicKey } from "@solana/web3.js"
import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";

const umi = createUmi('https://api.devnet.solana.com');

// We're going to import our keypair from the wallet file
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

// Define our Mint address
const mint = new PublicKey("Ae8i89B7SpPHpmQSiCBZNLyEP22BScbUQyp2AsGPrAn2")

// Add the Token Metadata Program
const token_metadata_program_id = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Create PDA for token metadata
const metadata_seeds = [
    Buffer.from('metadata'),
    token_metadata_program_id.toBuffer(),
    mint.toBuffer(),
];
const [metadata_pda, _bump] = PublicKey.findProgramAddressSync(metadata_seeds, token_metadata_program_id);

(async () => {
    try {
        let metadataTx = createMetadataAccountV3(
        umi, 
            {
                metadata: publicKey(metadata_pda.toString()),
                mint: publicKey(mint.toString()),
                mintAuthority: myKeypairSigner, 
                payer: myKeypairSigner, 
                updateAuthority: keypair.publicKey,
                data: {
                    name: "Jessica Token", 
                    symbol: "JES",
                    uri: "test_uri.org", 
                    sellerFeeBasisPoints: 0,
                    creators: null, 
                    collection: null, 
                    uses: null, 
                }, 
                isMutable: true,
                collectionDetails: null, 
            }
        ); 

        let result = await metadataTx.sendAndConfirm(umi);

        console.log(`Your metadata txid: ${result.signature}`); 
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();