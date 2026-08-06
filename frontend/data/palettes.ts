import type { BeadColor, Palette, PaletteId } from "@/types/bead"

type Row = [string, string, string, `#${string}`, boolean?]

function colors(
  brand: "Perler" | "Hama",
  series: string,
  rows: Row[]
): BeadColor[] {
  return rows.map(([code, zh, en, hex, special]) => ({
    id: `${brand.toLowerCase()}-${code.toLowerCase().replaceAll(" ", "-")}`,
    brand,
    series,
    code,
    zh,
    en,
    hex,
    effect: en === "Clear" ? "clear" : special ? "glow" : "solid",
    auto: !special,
  }))
}

const perler = colors("Perler", "Standard 5mm", [
  ["P01", "白色", "White", "#F5F4EF"],
  ["P02", "奶油色", "Cream", "#E9D8A6"],
  ["P03", "浅黄", "Pastel Yellow", "#FFE89A"],
  ["P04", "黄色", "Yellow", "#FFD52B"],
  ["P05", "切达黄", "Cheddar", "#F4A51C"],
  ["P06", "橙色", "Orange", "#F36B2B"],
  ["P07", "珊瑚红", "Hot Coral", "#F06058"],
  ["P08", "红色", "Red", "#C7333F"],
  ["P09", "樱桃红", "Cherry", "#A91F3D"],
  ["P10", "腮红", "Blush", "#F4B1A8"],
  ["P11", "粉色", "Pink", "#EB78A8"],
  ["P12", "覆盆子红", "Raspberry", "#D83E78"],
  ["P13", "洋红", "Magenta", "#B82E82"],
  ["P14", "淡紫", "Lavender", "#B69AD9"],
  ["P15", "紫色", "Purple", "#6B3C91"],
  ["P16", "梅紫", "Plum", "#4F2B62"],
  ["P17", "浅蓝", "Light Blue", "#8DC8E8"],
  ["P18", "蓝色", "Blue", "#2874BD"],
  ["P19", "钴蓝", "Cobalt", "#234D96"],
  ["P20", "深蓝", "Dark Blue", "#233B68"],
  ["P21", "绿松石", "Turquoise", "#37B7B5"],
  ["P22", "蓝绿色", "Teal", "#168886"],
  ["P23", "薄荷绿", "Mint", "#92D7BE"],
  ["P24", "青柠绿", "Kiwi Lime", "#9BCB3B"],
  ["P25", "鹦鹉绿", "Parrot Green", "#56A646"],
  ["P26", "三叶草绿", "Shamrock", "#27834A"],
  ["P27", "深绿", "Dark Green", "#23583D"],
  ["P28", "橄榄绿", "Olive", "#777B3D"],
  ["P29", "沙色", "Sand", "#C9AB78"],
  ["P30", "棕褐色", "Tan", "#A97850"],
  ["P31", "棕色", "Brown", "#71422C"],
  ["P32", "浅灰", "Light Gray", "#BBBDBB"],
  ["P33", "灰色", "Gray", "#77797B"],
  ["P34", "深灰", "Dark Gray", "#46484C"],
  ["P35", "黑色", "Black", "#202124"],
  ["P36", "透明", "Clear", "#E6EEF0", true],
])

const hama = colors("Hama", "Midi 5mm", [
  ["01", "白色", "White", "#F4F2E9"],
  ["02", "奶油色", "Cream", "#E7D6A7"],
  ["03", "黄色", "Yellow", "#F6D22A"],
  ["04", "橙色", "Orange", "#E96B2C"],
  ["05", "红色", "Red", "#C63A3E"],
  ["06", "粉色", "Pink", "#E68FB2"],
  ["07", "紫色", "Purple", "#745091"],
  ["08", "蓝色", "Blue", "#315E9E"],
  ["09", "浅蓝", "Light Blue", "#71B7DA"],
  ["10", "绿色", "Green", "#3F8B54"],
  ["11", "浅绿", "Light Green", "#79BC58"],
  ["12", "棕色", "Brown", "#77503A"],
  ["17", "灰色", "Grey", "#858687"],
  ["18", "黑色", "Black", "#252527"],
  ["20", "红棕", "Reddish Brown", "#874138"],
  ["21", "浅棕", "Light Brown", "#A97A55"],
  ["22", "深红", "Dark Red", "#8D2E39"],
  ["26", "肤色", "Flesh", "#E8B898"],
  ["27", "米色", "Beige", "#CFAE7E"],
  ["28", "深绿", "Dark Green", "#315B43"],
  ["29", "酒红", "Claret", "#713449"],
  ["30", "勃艮第红", "Burgundy", "#512D3C"],
  ["31", "绿松石", "Turquoise", "#2DA6A0"],
  ["43", "柔黄", "Pastel Yellow", "#F4E89C"],
  ["44", "柔红", "Pastel Red", "#D97978"],
  ["45", "柔紫", "Pastel Purple", "#A88DB6"],
  ["46", "柔蓝", "Pastel Blue", "#8BBBD1"],
  ["47", "柔绿", "Pastel Green", "#9BBF91"],
  ["48", "柔粉", "Pastel Pink", "#E4B7C7"],
  ["49", "天蓝", "Azure", "#4E91CA"],
  ["60", "泰迪棕", "Teddy Brown", "#A06A4B"],
  ["70", "浅杏", "Light Apricot", "#F0C3A5"],
  ["71", "深灰", "Dark Grey", "#55585B"],
  ["75", "石油蓝", "Petrol Blue", "#286B73"],
  ["76", "牛轧糖", "Nougat", "#C69073"],
  ["19", "透明", "Clear", "#E2EBEB", true],
])

export const palettes: Record<PaletteId, Palette> = {
  perler: {
    id: "perler",
    name: "Perler Standard 5mm",
    size: "5mm",
    source: "Perler 2025 Bead Color Reference",
    colors: perler,
  },
  hama: {
    id: "hama",
    name: "Hama Midi 5mm",
    size: "5mm",
    source: "Hama official colour chart",
    colors: hama,
  },
}

export function getPalette(id: PaletteId) {
  return palettes[id]
}
