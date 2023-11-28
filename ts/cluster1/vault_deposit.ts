import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
  LAMPORTS_PER_SOL,
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

// Create our program - Copy Program address here. 
const program = new Program<WbaVault>(
  IDL, 
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, 
  provider
);

// Create a random keypair - create vault state Public Key here
const vaultState = new PublicKey("4u2ZibbT9NM8MyZLLSN4Bza2rcefw9HXgepSXXZK3wjf")
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

  // Execute our enrollment transaction
  (async () => {
    try {
      const signature = await program.methods
        .deposit(new BN(LAMPORTS_PER_SOL * 1))
        .accounts({
          owner: keypair.publicKey,
          vaultState: vaultState,
          vaultAuth: vaultAuth,
          vault: vaultKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([keypair])
        .rpc();
      console.log(
        `Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
      );
    } catch (e) {
      console.error(`Oops, something went wrong: ${e}`);
    }
  })();
