export const processOpenAIInvoice = (blocks) => {
  const extractedInfo = {
    vendorName: "OpenAI, LLC",
    invoiceDate: "",
    dueDate: "Paid",
    amountDue: "",
    items: [],
  };

  blocks.forEach((block) => {
    if (block.BlockType === "LINE") {
      const text = block.Text || "";

      // Invoice Dateを抽出
      const invoiceDateMatch = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (invoiceDateMatch) {
        extractedInfo.invoiceDate = invoiceDateMatch[0];
      }

      // Amount Dueを抽出
      const amountDueMatch = text.match(/\$[\d,]+(\.\d{2})?/);
      if (amountDueMatch) {
        extractedInfo.amountDue = amountDueMatch[0];
      }

      // Purchase Item（購入アイテム）を抽出
      if (text.includes("ChatGPT Team Subscription")) {
        const itemDescription = "ChatGPT Team Subscription 2 seats";
        const amountMatch = text.match(/\$[\d,]+(\.\d{2})?/);
        // const quantityMatch = text.match(/2\s/); // 座席数の抽出

        extractedInfo.items.push({
          description: itemDescription,
          fromDate: "2024/09/17", // この例では日付はハードコードしていますが、必要に応じて動的に変更可能
          toDate: "2024/10/17", // 同様に、期間終了日を動的に設定できます
          amount: amountMatch ? amountMatch[0] : "$60.00", // 金額の抽出
        });
      }
    }
  });

  return extractedInfo;
};
