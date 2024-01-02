# Escrow Journal

In the ever-evolving world of blockchain technology, the implementation of escrow systems has become a cornerstone in ensuring secure and trustless interactions with smart contract systems. This readme details some of the intricacies of creating escrow programs on Solana, contrasting the traditional 'vanilla' approach with the streamline process offered by the Anchor and based Anchor frameworks. 

## What Is An Escrow

An escrow is a digital mechanism where assets or tokens are held by a third party smart contract until predefined conditions are met. An escrow ensures security in transactions between parties who may or may not trust each other. Once pre-determined conditions are fulfilled, an escrow smart contract automatically executes the transfer of assets. Basic escrow contracts are the backbone of DeFi applications, and allow for the creation of a trustless environment for payments, trading, and multi-party agreements. In essence, escrow contracts are vital to almost every web3 application one interacts with. 

![Basic-bitcoin-escrow-layout-1024x614](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/01782548-d1bc-422e-acff-2d4baad17841)

## Vanilla Escrow 

As detailed in the [Paulx blog post](https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction/#intro-motivation), creating an escrow on Solana without using a framework requires a deep understanding of Solana's low-level programming model. 

Say Alice (the payer) wishes to exchange Token X with Bob (the taker) for Token Y. Let's look at the accounts needed for an escrow contract to conduct such a transaction. Alice and Bob will both need a token account for both token X and token Y. This will be true in any escrow on Solana, as an associated token account is simply a program-derived account consisting of the wallet address itself and the token mint. If an associated token account for a given wallet address does not yet exist (in this case, Token Y for Alice and Token X for Bob), it may be created by anybody issuing the transaction. Because Solana programs are stateless, the vanilla escrow also requires the creation of an account to store the escrow state.    

![escrow-sketch-1 6df070a8](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/35f4abf0-5363-4514-b31e-2a5f35022227)

But this isn't all the accounts required to successfully broker this p2p token trade. Let's look at how Token X gets from the payer to the taker. Alice first transfers her token X to a temporary escrow account. While she is still the owner of this account, the token account authority is assigned to a PDA of the escrow program. Once the escrow program has validated the conditions of the escrow contract, the token X is transferred from the temporary escrow account to Bob's Token X account. 

The same account flow occurs to transfer Bob's token Y to Alice. Bob transfers Token Y to a temporary token account in which the authority is an escrow program PDA. Then Token Y is transferred from this temporary account to Alice's token Y account. 

So why are these temporary accounts necessary? To faciliate the transaction in a manner that requires minimal communication between users. Without these temporary accounts, the from address would have to sign the transaction initiated by the taker as well. This can result in frustration as takers will have to wait on the other party.     

![escrow_token_accounts_2 9291f5c8](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/c27fab0d-856a-4614-973a-02efabb903e3)

Further, in the escrow code presented in the PaulX blog post, there is no check that verifies that the amount of Token X the taker expects is equal to the amount of Token X in the escrow account. That means when the taker sends an instruction to claim the Token X in the temporary account, they are automatically agreeing to the terms of the escrow as written in the escrow information account. Thus if a "cancel" instruction is added and the rest of the code remains as is, the payer has the ability to claim the taker's Token Y and reclaim Token X. Thus, responsibility falls on the developer to write manual checks to ensure the terms of the escrow have been met.  

## Anchor Framework 

Anchor on Solana is a framework that offers developers a high-level environment for smart contract development. It utilizes Rust for building secure and efficient programs and integrates an Interface Description Language (IDL) to streamline client interactions. Anchor also provides extensive testing capabilities, simplifying the process of ensuring code reliability. It offers standardized development patterns through convenient macros, enhancing consistency and maintainability. Overall, Anchor's abstractions reduce the complexities associated with blockchain development, fostering a more accessible and robust ecosystem for Solana-based applications. Let's dig into how anchor simplifies writing an escrow. 

Anchor is extended from the vanilla escrow program. However, there is a critical difference. Using anchor escrow, the payer or initializer of an escrow creates a token account vault that has both a PDA key and authority. This means that when the payer sends a transaction to the escrow program to initialize the vault, a vault and escrow account to store state will be created and the token to be exchanged will be sent from the payer to the vault. 

![VmRKZUy](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/7415c90d-205a-4d17-b162-62015b2942a6)

In an exchange using the Anchor framework, the taker sends a transaction to the escrow to exchange their Token B for the payer's Token A. When this happens, the taker's Token B is first transferred from the taker to the payer. Then the payer's Token A that is being kept in the vault is transferred to the taker. Lastly both the vault and the escrow account are closed. This eliminates the need of the creation of a second temporary token account, as the taker's tokens are sent directly to the initializer. 

![MzG26dm](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/7bbe0949-0330-4792-8ddd-ea5dd33cee6f)

Anchor also greatly reduces the friction of cancelling an escrow. If the payer sends a transaction to the escrow program to cancel the escrow, the tokens in the vault are transferred back to the initializer and the vault and escrow account are closed. This eliminates the possibility that a cancel transaction could be front-run if a forgetful dev does not add appropriate checks into the code. 

![f6ahGXy](https://github.com/jhuhnke/escrow-journal-jessicahuhnke-solanaq4/assets/91915469/51fb98e3-6712-43ab-86bf-c49f81e5be00)

Anchor is great, but like many frameworks it was created to fulfill the needs of it's creators. Can it be improved any further? You bet! 

## Based Anchor Framework 

One example of an improved Anchor escrow is [Based Anchor](https://github.com/deanmlittle/anchor-escrow-2023/tree/master) created by Dean Little. This codebase uses multiple newer features of Anchor that were not available when the Iron Addicted Dog article was written. Further, the codebase much better factored and breaks each function into it's own file resulting in greater usability. So let's see how Based Anchor improves upon the original Anchor escrow. Because this code is factored so nicely, let's look at how each component differs from that of the OG Anchor Escrow. 

**Note:** This section will lack diagrams, because I'm too lazy to create them.

**Make Function** 

Like the Anchor Make function in Iron Addicted Dog, account initialization for the escrow and vault account uses seeds to create PDAs. However, in Based Anchor, the vault account is associated with both the token and the escrow account's key. This ensures that the vault can only be accessed by the escrow program according to the logic defined within it. This makes it more difficult if not impossible to move funds outside of the conditions enforced by the escrow. 

**Refund Function**

The Based Anchor refund mechanism introduces several improvements in security and operational clarity. It uses explicit seeding for account generation, which ties the vault directly to the escrow account, strengthening the link between them. Additionally, the separation into two distinct functions for emptying and closing the vault allows for a more controlled refund operation, enabling actions to be taken step-wise and reducing the risk of errors. The auth account, while being marked as unchecked, does not compromise security since it's not holding any funds, thereby simplifying the process without adding unnecessary risk. This approach to account handling and transaction processing ensures that the operations are performed securely and as intended, providing a clear and managed workflow for the refund process.

**Take Function**

The Based Anchor take function also presents several improvements in structure and clarity over vanilla Anchor. It explicitly defines the roles of the payer and taker in the escrow process, using distinct accounts for each action (deposit and withdraw). This separation enhances the readability and manageability of the code. Additionally, the use of the init_if_needed attribute for account initialization suggests a more dynamic approach, possibly reducing the overhead of account management. The explicit handling of the auth account, despite being marked unchecked, provides a clearer understanding of its role in the transaction process. Overall, these enhancements contribute to a more robust and user-friendly implementation of the escrow process.

**Update Function**

Based Anchor also expands on the functionality of the original Anchor escrow by adding an Update function. This allows the payer / initiator of the escrow transaction to update the escrow agreement's terms, specifically changing the taker's token mint and amount. The update struct accesses the escrow account using a combination of seeds, ensuring secure access. The update function alters the token to be received by the taker and the amount offered. This flexible approach allows for dynamic adjustments to escrow terms during its lifecycle.
