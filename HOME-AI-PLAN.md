# Home Remake Plan

## General

PRETTY NICE; now, on home/ page yield the current page (erase the actual content) and create a beautyfull home page dashboard showing important actions in a user friendly way; basically a bentogrid-based layout (on the side, middle is for chat);
using shadcn charts and display relevant information for club and user (conditional information between them); make it like a feed dashboard; where on middle is critical warnings (like contracts reaching expiration
date, no wallet connected) you can explore the page with a little of your criativity but always turned on this data side; add a AI chat on the top of page (basically the positioning of the twitter (now X) text box
to create a tweet) but it is a IA chat; make bridge to a GROQ with Vercel AI SDK (pay extra attention to lib version); this ai chat can query data on mongodb (the tool) to retrieve the important data about the contracts;
let's discuss what data is important to be there.

An important distinction here is the information players can see and the ones clubs can see; make it dynamic; some informations only clubs can see;

## Central Feed

create the 'feed' but instead of post it card informations;
feed should be centralized on screen (occupying ~60% of screen (as the contract inspection page is right now)) while floating boxes of extra information / warnings should be floating on the empty sides (left and right);
feed should be a infinite scroll (until the end of the information cards etc...);
take extra attention to the AI chat integration; specially to error handling, how UI reacts to it, etc...
take attention to infinite renderings and server side integration.
Show information like, latest on chain data which shows some special type of transactions of the account (using 'action type' transaction type);
the cards (posts in x) must have a little shadow on it, a glass aspect (see globals.css latest .glass classes) separated a little by a padding;
the cards should have the lime-green hover effect as most of the app's cards.
take extra attention to typography, make something beautyfull;

## AI Integration

Carefully make the state handling; take extra attention to this part; take the time you need.
Playwright is on project; use it with cucumber in order to make tests specially for this part;

The AI should also be possible to create contracts, read them, read transactions, accounts (only one logged);

## Side Floating Card Data

Show extra warnings for contracts like the ones reaching the deadline (in 1 month), pending signatures, etc... (use criativity! and related topics)

## Off

off the home page, you should set a Home link on navbar (right side of ePass logo, 1st link); that points to home page; keeps the logo redirecting to there too; add it to clubs and players;


The chat component: pnpm shadcn@latest add https://21st.dev/r/sensewood8/claude-style-chat-input