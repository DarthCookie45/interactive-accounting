"use strict";

// Add new entries here. The page sorts them alphabetically automatically.
const glossaryTerms = [
  {
    term: "Accrued expense", aliases: ["accrual", "unpaid expense"],
    definition: "A cost incurred during the accounting period that has not yet been paid. The amount owed is recorded as a liability.",
    example: "A café owes £200 for electricity used in March but will pay the bill in April. March’s accounts include the cost and the amount owed."
  },
  {
    term: "Asset", aliases: ["assets"],
    definition: "A resource controlled by a business as a result of past events, from which future economic benefits are expected.",
    example: "A hot dog van bought for £6,000 is a non-current asset used to help the business earn income."
  },
  {
    term: "Capital", aliases: ["owner’s capital", "owner's capital", "equity"],
    definition: "The owner’s interest in a business after its liabilities are deducted from its assets. Investment and profit increase capital; drawings and losses reduce it.",
    example: "The owner invests £10,000 into the business bank account. Bank and the owner’s capital both increase."
  },
  {
    term: "Credit", aliases: ["credits", "Cr"],
    definition: "An entry on the right-hand side of an account. Credits normally increase liabilities, capital and income, and decrease assets and expenses.",
    example: "When a business pays £300 from Bank for equipment, Bank is credited because the bank asset decreases."
  },
  {
    term: "DEADCLIC", aliases: ["DEAD CLIC", "acronym", "mnemonic"],
    definition: "A memory aid for normal increases: Debit Expenses, Assets and Drawings; Credit Liabilities, Income and Capital. Decreases normally use the opposite side.",
    example: "Rent is an expense. DEADCLIC helps you recall which side records an increase in that expense."
  },
  {
    term: "Debit", aliases: ["debits", "Dr"],
    definition: "An entry on the left-hand side of an account. Debits normally increase assets, expenses and drawings, and decrease liabilities, capital and income.",
    example: "When a business buys £300 of equipment, Equipment is debited because the equipment asset increases."
  },
  {
    term: "Drawings", aliases: ["owner withdrawal", "personal withdrawal"],
    definition: "Money or goods taken out of a business by its owner for personal use. Drawings reduce the owner’s capital and are not a business expense.",
    example: "A sole trader takes £100 from the business bank account for personal shopping. This is drawings, rather than wages or a business cost."
  },
  {
    term: "Expense", aliases: ["expenses", "operating costs"],
    definition: "A cost recognised in the accounting period that reduces profit, such as rent or wages. Buying a long-lasting asset is not automatically an expense in full when paid.",
    example: "A market trader’s £350 weekly pitch rent is an expense for that week."
  },
  {
    term: "Liability", aliases: ["liabilities", "debt"],
    definition: "A present obligation of a business arising from past events that is expected to require an outflow of resources, usually money.",
    example: "A bakery receives £500 of supplies on credit. The money owed to its supplier is a liability until paid."
  },
  {
    term: "Revenue", aliases: ["sales", "sales revenue", "income"],
    definition: "Income earned from a business’s ordinary activities, such as selling goods or providing services. It is measured before deducting expenses.",
    example: "Selling 20 hot dogs at £3.50 each produces £70 of sales revenue, before deducting ingredients and other costs."
  },
  {
    term: "Statement of financial position", aliases: ["SFP", "balance sheet"],
    definition: "A financial statement showing a business’s assets, liabilities and capital at a particular date. Assets equal capital plus liabilities.",
    example: "At Sunday’s close, a van business lists its vehicle, equipment, remaining ingredients and Bank balance alongside its capital and any liabilities."
  },
  {
    term: "Statement of profit or loss", aliases: ["SPL", "profit and loss", "P&L", "income statement"],
    definition: "A financial statement summarising income and expenses over a period to show whether the business made a profit or a loss.",
    example: "A van earns £2,000 of sales revenue during a week and incurs £1,300 of costs and expenses. Its profit for the week is £700."
  },
  {
    term: "Trial balance", aliases: ["TB"],
    definition: "A list of ledger account balances in debit and credit columns at a particular date. Equal totals are a useful check, but do not prove that every entry is correct.",
    example: "A business checks that total debit balances equal total credit balances before preparing its financial statements. A transaction in the wrong account may still leave the totals equal."
  }
].concat([
  ["Account", ["accounts"], "A record of increases, decreases and the balance of a particular asset, liability, capital item, income or expense.", "The Bank account records money entering and leaving the business bank account."],
  ["Accounting cycle", ["accounting process"], "The sequence used to identify transactions, record them, check balances and prepare financial statements for a period.", "A shop collects invoices, records entries, prepares a trial balance and then produces its financial statements."],
  ["Accounting equation", ["A = C + L", "A = L + E"], "The relationship assets = capital + liabilities. Every correctly recorded transaction preserves this equality.", "A business with £12,000 of assets and £2,000 of liabilities has £10,000 of capital."],
  ["Accounting period", ["reporting period", "financial year"], "The span of time covered by a set of accounts. A teaching activity may use a week; business accounts commonly cover a year.", "A weekly profit or loss statement covers Monday to Sunday, while the SFP shows the position at Sunday’s close."],
  ["Accruals basis", ["accrual accounting", "matching"], "Recognising income when earned and expenses when incurred, rather than simply when money is received or paid.", "Electricity used in March belongs in March’s costs even if the bill is paid in April."],
  ["Accrued income", ["income receivable"], "Income earned in the current period but not yet received or recorded. The right to receive payment is an asset.", "A consultant earns £300 by the period end but has not yet invoiced the customer. An accrual recognises the income and asset."],
  ["Accumulated depreciation", ["total depreciation"], "The total depreciation charged on an asset so far. It is deducted from the asset’s cost to find its carrying amount.", "Equipment costing £3,000 with £1,000 accumulated depreciation has a carrying amount of £2,000."],
  ["Allowance for doubtful receivables", ["doubtful debts", "receivables allowance"], "An estimate of the part of receivables that may not be collected. It reduces the net amount shown as receivables.", "Receivables of £10,000 less a £500 allowance are shown at £9,500 net."],
  ["Bad debt", ["irrecoverable debt", "bad debts"], "An amount owed by a customer that is no longer expected to be collected and is written off.", "A customer owing £120 cannot pay. The business removes the receivable and recognises the loss."],
  ["Balance brought down", ["balance b/d", "b/d", "brought forward", "b/f"], "The opening balance carried into the next period on the account’s normal balance side.", "A £500 debit Bank balance is brought down on the debit side at the start of the next period."],
  ["Balance carried down", ["balance c/d", "c/d", "carried forward", "c/f"], "The closing balance inserted on the smaller side of a T-account so both sides total equally before the balance is brought down.", "Bank has £800 of debits and £300 of credits. A £500 balance c/d on the credit side makes both totals £800."],
  ["Bank loan", ["loan principal", "borrowing"], "Money borrowed that the business must repay. Principal is the amount borrowed or still outstanding, separate from interest.", "Receiving a £2,000 loan increases Bank and the loan liability; it is not sales income."],
  ["Bank overdraft", ["overdraft"], "An amount owed to a bank when the business has withdrawn more money than is available in its account. It is a liability.", "If an authorised bank account is £200 overdrawn, the business owes £200 to the bank."],
  ["Capital expenditure", ["capex"], "Spending recognised as an asset because it provides benefits beyond the current period, rather than being charged immediately as a running expense.", "Buying a £6,000 van for ongoing business use is capital expenditure."],
  ["Carrying amount", ["book value", "net book value", "NBV"], "The amount at which an asset is shown in the accounts after relevant deductions, such as accumulated depreciation.", "A van costing £6,000 less £1,200 accumulated depreciation has a carrying amount of £4,800."],
  ["Cash book", ["cashbook"], "A record of cash and bank receipts and payments. It can also serve as the cash and bank ledger accounts.", "A trader records a customer’s £70 bank payment in the bank column of the cash book."],
  ["Cash flow", ["cashflow", "cash flows"], "The movement of cash into and out of a business. Cash flow differs from profit because some receipts and payments are not income or expenses.", "A bank loan brings in cash but does not create profit."],
  ["Closing inventory", ["closing stock", "inventory SPL", "inventory SFP"], "Goods remaining at the period end, valued at the lower of cost and net realisable value. It is a current asset and reduces cost of sales in periodic inventory accounting.", "£60 of unused ingredients appears in current assets and is deducted when calculating the week’s cost of sales."],
  ["Contra account", ["contra asset", "offset account"], "An account whose balance offsets a related account, allowing the original amount and its deduction to be recorded separately.", "Accumulated depreciation offsets the cost of equipment without removing the equipment’s original cost."],
  ["Cost of sales", ["COS", "COGS", "cost of goods sold"], "The cost of goods sold during a period. A simple periodic calculation is opening inventory + purchases − closing inventory.", "Opening stock £100 + purchases £500 − closing stock £80 gives cost of sales of £520."],
  ["Credit note", ["credit memo"], "A document reducing an amount previously invoiced, for example after goods are returned or an overcharge is corrected.", "A supplier issues a £40 credit note when a business returns damaged goods."],
  ["Credit sale", ["credit sales", "sale on credit"], "A sale where the customer will pay later. Income is recognised when earned, and the unpaid amount is a receivable.", "A florist sells £150 of flowers on credit, increasing Sales and Trade receivables."],
  ["Current asset", ["current assets"], "An asset expected to be realised, sold or used in the normal operating cycle, or otherwise meeting current classification such as short-term cash or receivables.", "Inventory, trade receivables and available Bank balances are common current assets."],
  ["Current liability", ["current liabilities"], "An obligation due for settlement in the normal operating cycle or within twelve months, subject to the relevant classification rules.", "A supplier invoice due next month is a current liability."],
  ["D.E.A.L.E.R.", ["DEALER", "D E A L E R", "acronym", "mnemonic"], "A memory aid for normal increases: Drawings, Expenses and Assets normally increase with debits; Liabilities, Equity and Revenue normally increase with credits. In company-accounting versions, the first D may mean Dividends instead of Drawings.", "For a sole trader, a personal withdrawal belongs to Drawings. DEALER helps you recall the normal side for an increase."],
  ["Deferred income", ["prepaid income", "income received in advance", "unearned revenue"], "Money received for goods or services not yet provided. The unearned portion is a liability until the business fulfils its obligation.", "A tutor receives £200 for lessons next month. That amount is not yet this month’s earned income."],
  ["Depreciation", ["depreciation expense"], "The systematic allocation of an asset’s depreciable amount over its useful life. It is not a new bank payment or a prediction of market price.", "Equipment costing £3,000 with no residual value and a five-year life has £600 annual straight-line depreciation."],
  ["Dividend", ["dividends"], "A distribution of a company’s profits to shareholders. It is an owner distribution rather than an operating expense.", "A company distributes £500 to its shareholders; this is not staff wages or a cost of making sales."],
  ["Double-entry bookkeeping", ["double entry", "double-entry", "doubleentry", "bookkeeping"], "Recording every transaction with equal total debits and credits across at least two accounts. An entry may involve more than two accounts, but its totals must balance.", "Buying £300 of equipment from Bank debits Equipment £300 and credits Bank £300."],
  ["Equity", ["owner equity", "shareholders equity"], "The residual interest in a business’s assets after deducting liabilities. For a sole trader, this is generally described as the owner’s capital.", "Assets of £15,000 less liabilities of £4,000 leave equity of £11,000."],
  ["General ledger", ["ledger", "nominal ledger"], "The collection of accounts used to group transactions and determine each account’s balance.", "Entries recorded in date order are posted to accounts such as Bank, Sales and Rent expense in the ledger."],
  ["Gross profit", ["GP"], "Sales revenue less cost of sales, before deducting other operating expenses.", "Sales of £1,000 less cost of sales of £400 produce gross profit of £600."],
  ["Gross profit margin", ["gross margin", "GP margin"], "Gross profit expressed as a percentage of sales revenue: gross profit ÷ revenue × 100.", "Gross profit £600 on revenue £1,000 gives a gross profit margin of 60%."],
  ["Interest", ["interest expense", "finance cost"], "The charge for borrowing money, separate from repayment of the amount borrowed.", "A £110 loan payment contains £100 principal and £10 interest. Only the £10 is interest expense."],
  ["Inventory", ["stock", "goods for resale"], "Goods held for sale, or materials and supplies to be used in production or providing services.", "A hot dog business’s unused buns and sausages are inventory rather than equipment."],
  ["Invoice", ["sales invoice", "purchase invoice"], "A document setting out goods or services supplied, the amount charged and payment details. It is not itself proof that payment has been made.", "An invoice for £250 payable in thirty days creates an amount owed until it is settled."],
  ["Journal entry", ["journal", "journals"], "A dated record of a transaction showing the accounts to debit and credit, the amounts and usually a brief explanation.", "A journal for a £100 owner withdrawal debits Drawings and credits Bank."],
  ["Liquidity", ["liquid assets"], "The ability of a business to meet its short-term obligations as they fall due.", "A profitable shop may still struggle to pay a bill if its customers have not yet paid their invoices."],
  ["Loss", ["net loss"], "The amount by which expenses exceed income for a period.", "Revenue of £800 and total costs and expenses of £950 give a loss of £150."],
  ["Narrative", ["narration", "journal description"], "A short description explaining an accounting entry. In a T-account, the detail often identifies the other account in the transaction.", "For an owner investment, the Bank T-account can show Owner’s capital as the detail for the receipt."],
  ["Net profit", ["NP", "profit for the period", "net income"], "The profit remaining after deducting relevant expenses from income. In these simplified activities, gross profit less operating expenses gives net profit.", "Gross profit of £600 less rent and wages of £250 gives net profit of £350."],
  ["Net profit margin", ["net margin", "NP margin"], "Net profit expressed as a percentage of sales revenue: net profit ÷ revenue × 100.", "Net profit of £200 on sales of £1,000 gives a net profit margin of 20%."],
  ["Net realisable value", ["NRV", "net realizable value"], "The estimated selling price of inventory less the costs needed to complete and sell it.", "Stock cost £80 but can now sell for £70 with £5 selling costs. Its NRV is £65, so it is valued at £65."],
  ["Non-current asset", ["non current assets", "fixed asset", "fixed assets"], "An asset that is not classified as current, commonly held for use over more than one period.", "The van and cooking equipment used to operate a food business are non-current assets."],
  ["Non-current liability", ["non current liabilities", "long-term liability"], "A liability that does not meet the conditions for current classification, commonly an obligation repayable beyond twelve months.", "The portion of a long-term loan not due within the next year may be non-current."],
  ["Normal balance", ["normal balances"], "The side on which an account usually has its balance, based on its category. Actual transactions can sometimes produce an unusual balance.", "An asset usually has a debit balance, while income usually has a credit balance."],
  ["Opening inventory", ["opening stock"], "The value of inventory held at the start of an accounting period, normally carried forward from the previous period’s closing inventory.", "Last Sunday’s closing stock of £60 becomes the next week’s opening inventory."],
  ["Posting", ["post to ledger", "posted entry"], "Transferring or recording the debit and credit details of a transaction into the relevant ledger accounts.", "A sales journal is posted to Bank and Sales so both account balances update."],
  ["Prepaid expense", ["prepayment", "prepayments", "expense paid in advance"], "A payment for a benefit relating to a future period. The unused portion is an asset rather than an expense of the current period.", "£1,200 annual insurance paid on 1 January leaves a £1,100 prepayment after one month’s £100 cost is recognised."],
  ["Property, plant and equipment", ["PPE", "tangible non-current assets"], "Physical assets held for use in running a business over more than one period, rather than primarily for resale.", "A delivery van and a bakery oven are examples of PPE."],
  ["Purchases", ["purchase account", "goods purchased"], "The cost of goods bought for resale or materials bought for production in a periodic inventory system. It does not include every item a business buys.", "Ingredients bought for hot dogs go to Purchases; a long-lasting cooking unit goes to Equipment."],
  ["Purchase returns", ["returns outwards", "purchases returns"], "Goods returned by a business to its supplier, reducing the net cost of purchases.", "Returning £40 of damaged supplies reduces the amount owed to the supplier and the net purchases cost."],
  ["Residual value", ["scrap value"], "The estimated amount recoverable from an asset’s disposal at the end of its useful life, after disposal costs.", "A machine costing £3,000 with £500 residual value has £2,500 to allocate as depreciation over its life."],
  ["Revenue expenditure", ["running costs"], "Spending recognised as an expense of the period, rather than the cost of acquiring or improving a long-term asset.", "A routine £85 tyre repair maintains a van and is a running expense, rather than the purchase of a new van."],
  ["Sales returns", ["returns inwards"], "Goods returned by customers, reducing net sales revenue.", "A customer returns £30 of goods for a refund. The business records a reduction to its sales."],
  ["Sole trader", ["sole proprietor", "sole proprietorship"], "A business owned by one individual. Its accounting records distinguish business transactions from the owner’s personal transactions.", "A self-employed market trader records personal withdrawals as Drawings, separately from business expenses."],
  ["Source document", ["source documents"], "Original evidence supporting a business transaction, such as an invoice, receipt or bank record.", "A supplier’s invoice supports the amount and details of a purchase entered in the accounts."],
  ["Straight-line depreciation", ["straight line", "SL depreciation"], "A method allocating an equal depreciation charge over each full year of an asset’s useful life: cost less residual value, divided by useful life.", "Cost £3,000 less residual value £500, over five years, gives £500 annual depreciation."],
  ["T-account", ["T account", "T accounts", "T-accounts"], "A simple ledger layout with debits on the left and credits on the right, used to record movements and calculate an account balance.", "The Bank T-account places money received on its debit side and money paid out on its credit side."],
  ["Trade payables", ["accounts payable", "AP", "creditors", "supplier balances"], "Amounts owed to suppliers for goods or services bought on credit.", "A café buys £200 of ingredients and agrees to pay next month. It records a £200 trade payable."],
  ["Trade receivables", ["accounts receivable", "AR", "debtors", "customer balances"], "Amounts owed by customers for goods or services already supplied on credit.", "A customer owes £150 for delivered flowers. The florist records a £150 trade receivable."],
  ["Value added tax", ["VAT"], "A tax charged on many supplies of goods and services. Where applicable, VAT accounting distinguishes tax on sales from recoverable tax on purchases. The introductory activities here ignore VAT.", "An invoice may show the price before VAT, VAT separately and the total to pay."],
  ["Working capital", ["net current assets"], "Current assets less current liabilities, indicating the net resources tied up in short-term operations.", "Current assets of £3,000 less current liabilities of £1,200 give working capital of £1,800."]
].map(([term, aliases, definition, example]) => ({ term, aliases, definition, example })))
  .sort((a, b) => a.term.localeCompare(b.term, "en-GB"));

const glossarySearch = document.getElementById("glossary-search");
const glossaryClear = document.getElementById("glossary-clear");
const glossaryResults = document.getElementById("glossary-results");
const glossaryCount = document.getElementById("glossary-count");
const glossaryEmpty = document.getElementById("glossary-empty");

function normaliseGlossaryText(text) {
  return text.toLocaleLowerCase("en-GB")
    .replace(/\b(?:[a-z]\.){2,}[a-z]?\.?/g, (acronym) => acronym.replace(/\./g, ""))
    .replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function filterGlossaryTerms(query) {
  const words = normaliseGlossaryText(query).split(/\s+/).filter(Boolean);
  return glossaryTerms.filter((entry) => {
    const searchable = normaliseGlossaryText([entry.term, ...entry.aliases, entry.definition, entry.example].join(" "));
    return words.every((word) => searchable.includes(word));
  });
}

function renderGlossary() {
  const matches = filterGlossaryTerms(glossarySearch.value);
  glossaryResults.replaceChildren();
  for (const entry of matches) {
    const card = document.createElement("article");
    card.className = "glossary-card";
    const title = document.createElement("h2");
    title.textContent = entry.term;
    const definition = document.createElement("p");
    definition.textContent = entry.definition;
    const example = document.createElement("p");
    example.className = "glossary-example";
    const label = document.createElement("strong");
    label.textContent = "Example: ";
    example.append(label, document.createTextNode(entry.example));
    card.append(title, definition, example);
    glossaryResults.append(card);
  }
  glossaryEmpty.hidden = matches.length !== 0;
  glossaryClear.disabled = glossarySearch.value.length === 0;
  glossaryCount.textContent = matches.length === glossaryTerms.length
    ? "Showing all " + glossaryTerms.length + " terms · A–Z"
    : "Showing " + matches.length + " of " + glossaryTerms.length + " terms · A–Z";
}

glossarySearch.addEventListener("input", renderGlossary);
glossaryClear.addEventListener("click", () => {
  glossarySearch.value = "";
  renderGlossary();
  glossarySearch.focus();
});
renderGlossary();

const glossaryBackTop = document.getElementById("glossary-back-top");
function updateBackTop() {
  glossaryBackTop.hidden = window.scrollY < 300;
}
window.addEventListener("scroll", updateBackTop, { passive: true });
window.addEventListener("resize", updateBackTop);
// Search can shorten the page and change its scroll position.
glossarySearch.addEventListener("input", () => requestAnimationFrame(updateBackTop));
glossaryClear.addEventListener("click", () => requestAnimationFrame(updateBackTop));
glossaryBackTop.addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
  // Keep keyboard users at the destination when the floating button disappears.
  const heading = document.querySelector(".glossary-page h1");
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
});
updateBackTop();
