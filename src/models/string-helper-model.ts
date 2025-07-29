export class StringHelper {
  static getInitials(name: string): string {
    const spl = name.split(" ").filter((item) => item.trim());
    if (spl.length > 1) {
      return `${spl[0].charAt(0)}${spl[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  static downloadCSV(jsonData, fileName) {
    const array = [
      Object.keys(jsonData[0]),
      ...jsonData.map((obj) => Object.values(obj)),
    ];
    const csv = array
      .map((row) =>
        row
          .map(String)
          .map((value) => `"${value.replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
