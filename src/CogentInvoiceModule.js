// CogentInvoiceModule.js

export const processCogentInvoice = (blocks) => {
  let extractedInfo = {
    vendorName: "Cogent Communications, LLC",
    invoiceDate: "",
    dueDate: "",
    amountDue: "",
    items: [],
  };

  let isItemSection = false;
  let currentItem = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.BlockType === "LINE") {
      const text = block.Text || "";
      console.log("Text:", text);

      // Invoice Date
      if (text.includes("Invoice Date") && !extractedInfo.invoiceDate) {
        // 次のブロックから日付を探す
        for (let j = i + 1; j < i + 5; j++) {
          if (blocks[j] && blocks[j].BlockType === "LINE") {
            const dateText = blocks[j].Text;
            if (isValidDate(dateText)) {
              extractedInfo.invoiceDate = dateText;
              console.log("Invoice Date Found:", extractedInfo.invoiceDate);
              break;
            }
          }
        }
      }

      // Due Date
      if (text.includes("Due Date") && !extractedInfo.dueDate) {
        for (let j = i + 1; j < i + 5; j++) {
          if (blocks[j] && blocks[j].BlockType === "LINE") {
            const dueDateText = blocks[j].Text;
            if (
              isValidDate(dueDateText) ||
              dueDateText.toLowerCase().includes("due upon receipt")
            ) {
              extractedInfo.dueDate = dueDateText;
              console.log("Due Date Found:", extractedInfo.dueDate);
              break;
            }
          }
        }
      }

      // Amount Due
      if (text.includes("Amount Due") && !extractedInfo.amountDue) {
        // 同じ行または次の数ブロックで金額を探す
        const amountMatch = text.match(/^\$[\d,()-]+\.\d{2}$/);
        if (amountMatch) {
          extractedInfo.amountDue = amountMatch[0];
        } else {
          for (let j = i + 1; j < i + 5; j++) {
            if (blocks[j] && blocks[j].BlockType === "LINE") {
              const amountText = blocks[j].Text;
              const amountMatch = amountText.match(/^\$[\d,()-]+\.\d{2}$/);
              if (amountMatch) {
                extractedInfo.amountDue = amountMatch[0];
                break;
              }
            }
          }
        }
        console.log("Amount Due Found:", extractedInfo.amountDue);
      }

      // アイテムセクションの開始を検出
      if (text.toLowerCase().includes("description")) {
        isItemSection = true;
        currentItem = {
          description: "",
          fromDate: "",
          toDate: "",
          amount: "",
        };
        continue;
      }

      // アイテムセクションの終了を検出
      if (text.includes("Amount Due") && isItemSection) {
        isItemSection = false;
        currentItem = null;
        continue;
      }

      if (isItemSection) {
        // ヘッダー行や空行をスキップ
        if (
          [
            "DATE",
            "DESCRIPTION",
            "FROM",
            "TO",
            "PRICE",
            "AMOUNT",
            "",
            "ITEM",
          ].includes(text.toUpperCase())
        ) {
          continue;
        }

        // 金額を検出
        const amountMatch = text.match(/^\$[\d,()-]+\.\d{2}$/);
        if (amountMatch) {
          currentItem.amount = text;
          // すべてのフィールドが揃っていればアイテムを追加
          if (
            currentItem.description &&
            currentItem.fromDate &&
            currentItem.toDate
          ) {
            extractedInfo.items.push(currentItem);
            console.log("Item Added:", currentItem);
            currentItem = {
              description: "",
              fromDate: "",
              toDate: "",
              amount: "",
            };
          }
          continue;
        }

        // 日付を検出
        if (isValidDate(text)) {
          if (!currentItem.fromDate) {
            currentItem.fromDate = text;
            continue;
          } else if (!currentItem.toDate) {
            currentItem.toDate = text;
            continue;
          }
        } else {
          // 説明文を構築
          if (currentItem.description) {
            currentItem.description += " " + text;
          } else {
            currentItem.description = text;
          }
        }
      }
    }
  }

  console.log("Extracted Info:", extractedInfo);
  return extractedInfo;
};

// 日付の形式を検証する関数
const isValidDate = (dateString) => {
  // 日付形式にマッチする正規表現 (MM/DD/YY または MM/DD/YYYY)
  const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/(\d{2}|\d{4})$/;
  return regex.test(dateString);
};
