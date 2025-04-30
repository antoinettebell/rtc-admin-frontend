export class StringHelper {
  static getInitials(name: string): string {
    const spl = name.split(" ").filter((item) => item.trim());
    if (spl.length > 1) {
      return `${spl[0].charAt(0)}${spl[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
