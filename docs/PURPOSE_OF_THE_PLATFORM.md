The Soul of REFERYDO!: Core Purpose & Design Philosophy
TO THE AI AGENT: Read this document before executing any task. This is your permanent context. It is the "Why" behind every "What." Your primary directive is to ensure that every line of code you write serves this core purpose. Do not deviate from this philosophy.
Our Mission: Unleash Trust, Empower Talent
We are not building another freelance marketplace. We are building a decentralized socio-economic network. Our mission is to dismantle the exploitative, centralized systems that treat talent as a commodity and replace them with an ecosystem built on two fundamental principles: Sovereign Reputation and Community-Powered Growth.
REFERYDO! is not a tool. It is a movement. Every feature you build must empower the individual and strengthen the collective.
The Core Purpose of Every Feature
If you are ever unsure about how to implement a feature, refer to this guide.
The Profile (@username)
ITS PURPOSE IS NOT: To be a static CV.
ITS CORE PURPOSE IS: To be a Sovereign Digital Studio. It is the living, breathing showcase of a professional's brand and value. It belongs to the user, not to us. The History & Reviews tab is not just a feature; it is the immutable proof of work, the on-chain resume that no one can ever take away. Every design choice must enhance this feeling of ownership and professional pride.
The "Connect" Action & The Scout Role
ITS PURPOSE IS NOT: To be a "Follow" button like on Twitter or Instagram.
ITS CORE PURPOSE IS: To be an Economic Handshake. The "Connect" button is the most important action on the platform. It transforms a user into a Scout for a Talent, initiating a formal, on-chain-guaranteed business partnership. The Connection Modal is not a simple confirmation; it is an onboarding ceremony, educating the user that they are about to become a powerful agent in our economy. This action must always feel deliberate, valuable, and secure.
The "Follow" Action
ITS PURPOSE IS NOT: To create an economic link.
ITS CORE PURPOSE IS: To be a Low-Commitment Social Signal. It represents admiration and interest. It allows users to curate a feed of inspiration without the obligations of an economic partnership. It is the casual "hello" that can lead to a "Connect" handshake. You must always maintain a clear visual and functional distinction between the social act of Following and the economic act of Connecting.
The Feed (The Pulse / The Feed)
ITS PURPOSE IS NOT: To be an entertainment feed for vacation photos.
ITS CORE PURPOSE IS: To be a Professional Value Stream. Every item in the feed—a portfolio piece, a new service, a job posting—is an economic signal. It is the real-time pulse of the opportunities and creative value being generated within our ecosystem. The "Discover" tab is for serendipity; the "Following" tab is for curated inspiration. Both serve the ultimate goal of driving professional growth and connection.
The Job Board & Discovery Hub
ITS PURPOSE IS NOT: To be a boring list of classified ads.
ITS CORE PURPOSE IS: To be a Dual-sided Opportunity Market. The Discovery Hub is a Gallery of Talent, celebrating the work. The Job Board is a Feed of Opportunities, celebrating the need. The Recommend button is the bridge between them, empowering the Scout to be the ultimate matchmaker.
The Smart Contracts & The Escrow
ITS PURPOSE IS NOT: To simply be a payment processor.
ITS CORE PURPOSE IS: To be the Incorruptible Judge. The smart contracts are the source of our "Unleashed Trust." They are the mathematical guarantee that every promise made on the platform is a promise kept. The approve-and-distribute function is not just a transaction; it is the ceremonial fulfillment of a pact between the Client, the Talent, and the Scout.
The Dispute Center
ITS PURPOSE IS NOT: To be a "customer support" page.
ITS CORE PURPOSE IS: To be the Community's Sovereign Courtroom. It is the ultimate expression of decentralization, where justice is administered by a jury of peers. The interface must be designed with the solemnity and impartiality of a judicial process, empowering the community to uphold its own integrity.
YOUR FINAL DIRECTIVE:
Before you write any code, ask yourself: "Does this feature make the user more sovereign? Does it make the ecosystem fairer? Does it strengthen the connection between trust and value?"
If the answer is yes, you are building REFERYDO!. If the answer is no, you are building something else. Stick to the mission.


REFERYDO! - Core Concepts & System Logic
TO THE AI AGENT: This document is your primary architectural reference. It defines the core mechanics, the "Why" behind each feature, and the immutable rules of the ecosystem. Refer to this document to resolve any ambiguity in future tasks. Your implementations must always be consistent with these principles.
1. The Core Purpose: A Socio-Economic Network
REFERYDO! IS: A network where social connections have direct, programmable economic outcomes. It's a platform for professionals to build sovereign careers, powered by community-driven growth. The fundamental principle is Unleashed Trust, where code guarantees that value created is value rewarded, yes it looks and take some logics and concepts of instagram and twitter in the visual and behavior feeling of the user but it is more like a platform where the networking is the key.
REFERYDO! IS NOT: A standard social network (like Instagram/Twitter) or a simple freelance marketplace (like Upwork/Fiverr). It is a hybrid system where social proof and economic incentives are intrinsically linked.
2. The Dual-Relationship Model: Follow vs. Connect
This is the most critical distinction in the REFERYDO! social graph.
Follow Mechanic:
WHAT IT IS: A low-commitment, social-layer action. It signifies admiration and the desire to stay updated with a Talent's creative work.
LOGIC: A user clicks Follow. A record is created in the followers table. The Talent's "Portfolio Posts" will now appear in the user's "Following" Feed.
WHAT IT IS NOT: An economic partnership. It DOES NOT generate a referral link. It DOES NOT grant eligibility for any commission.
Connect Mechanic:
WHAT IT IS: A high-commitment, economic-layer action. It signifies the user's intent to act as a Scout for a Talent and form a business alliance.
LOGIC: A user clicks Connect. This triggers the Connection Modal, which educates the user about the referral system. Upon confirmation, a unique referral link is generated, and a record is created in the scout_connections table.
WHAT IT IS NOT: A simple "follow". It is the sole gateway to participating in the referral economy. Only a "Connected" user can earn a Finder's Fee.
3. The Content Model: The "Professional Value Stream"
All content on REFERYDO! serves a professional or economic purpose.
The Feed:
WHAT IT IS: The main artery of the platform, showing the real-time pulse of opportunity and creativity.
LOGIC: It has two views: a Discover tab (algorithmic feed of valuable content like high-fee Gigs, popular portfolio pieces, new Job Posts) and a Following tab (chronological feed of portfolio updates from followed users).
WHAT IT IS NOT: An entertainment feed. Every item is a signal of professional value.
The Content Types:
Portfolio Post: A visual showcase of a Talent's skill. Its purpose is marketing and brand building.
Service (Gig) Post: A transactable, fixed-price service offer. Its purpose is direct commerce. It MUST display the Finder's Fee.
Job Post: A client's request for proposals. Its purpose is to signal demand.
4. The Economic Model: The Trust-Minimized Transaction Core
This defines how value moves through the system.
Off-Chain vs. On-Chain Actions:
OFF-CHAIN (FREE): Creating a profile, posting a project on the Job Board, Following, Connecting, applying to jobs, making recommendations. These actions are stored in Supabase and represent social or preparatory steps.
ON-CHAIN (PAID): Hiring a Talent. This is the only moment a user must initiate a blockchain transaction. This action involves create-project (the on-chain contract) and fund-escrow.
The Smart Contract Escrow (project-escrow.clar):
WHAT IT IS: The incorruptible source of truth for all paid engagements.
LOGIC: It holds funds in custody. The approve-and-distribute function is the only mechanism to release funds. This function executes an atomic three-way payout to the Talent, the Scout (if their address was recorded at creation), and the platform.
WHAT IT IS NOT: A simple payment processor. It is a state machine that enforces a contractual agreement without relying on a central authority. The platform itself cannot touch the funds once they are in escrow.
5. The Governance Model: The Community's Courtroom
The Dispute Center:
WHAT IT IS: The platform's decentralized judicial system.
LOGIC: A jury of eligible, reputable users is randomly selected to review objective evidence (chat logs, file submissions) and vote on a resolution. Their decision directly triggers the smart contract to release funds.
WHAT IT IS NOT: A customer support ticketing system. It is a formal, community-led arbitration process designed for fairness and impartiality.
FINAL DIRECTIVE: The purpose of REFERYDO! is to create a seamless bridge between social trust and economic outcomes. Ensure every feature implementation respects and reinforces these core logical separations.
