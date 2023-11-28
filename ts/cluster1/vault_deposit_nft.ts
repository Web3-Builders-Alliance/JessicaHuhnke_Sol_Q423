import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import wallet from "../wba-wallet.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "confirmed";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const program = new Program<WbaVault>(
  IDL, 
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, 
  provider
);

// Create a random keypair
const vaultState = new PublicKey("4u2ZibbT9NM8MyZLLSN4Bza2rcefw9HXgepSXXZK3wjf");

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
const vaultAuthKeys = [Buffer.from("auth"), vaultState.toBuffer()];
  const [vaultAuth, _bump] = PublicKey.findProgramAddressSync(
    vaultAuthKeys,
    program.programId
  ); 

// Create the vault key
// Seeds are "vault", vaultAuth
const vaultKeys = [Buffer.from("vault"), vaultAuth.toBuffer()];
  const [vaultKey, _bump2] = PublicKey.findProgramAddressSync(
    vaultKeys,
    program.programId
  ); 

// Mint address
const mint = new PublicKey("EPxEfQCpnzCwEy3PbrEa74FPdxfnLioTHpo1Hqgxbe1T");

// Execute our deposit transaction
(async () => {
  try {
    const metadataProgram = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    );
    const metadataAccount = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), metadataProgram.toBuffer(), mint.toBuffer()],
      metadataProgram,
    )[0];
    const masterEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgram.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgram,
    )[0];

    // b"metadata", MetadataProgramID.key.as_ref(), mint.key.as_ref() "master"
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection, 
        keypair, 
        mint, 
        keypair.publicKey
    );

    // // Get the token account of the fromWallet address, and if it does not exist, create it
    const vaultAta = await getOrCreateAssociatedTokenAccount(
        connection, 
        keypair, 
        mint, 
        vaultAuth,
        true, 
        commitment
    );

    const signature = await program.methods
    .depositNft()
    .accounts({
        owner: keypair.publicKey,
        vaultState, 
        vaultAuth, 
        systemProgram: SystemProgram.programId,
        ownerAta: ownerAta.address,
        vaultAta: vaultAta.address, 
        tokenMint: mint, 
        nftMetadata: metadataAccount,
        nftMasterEdition: masterEdition,
        metadataProgram: metadataProgram,
        tokenProgram: TOKEN_PROGRAM_ID, 
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
    })
    .signers([
        keypair
    ]).rpc();
    console.log(`Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
