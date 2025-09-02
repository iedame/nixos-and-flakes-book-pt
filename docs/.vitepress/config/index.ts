import { defineConfig } from "vitepress"
import { shared } from "./shared"
import { pt } from "./pt"

export default defineConfig({
  base: "/nixos-and-flakes-book-pt/",

  ...shared,
  title: "NixOS & Flakes Book",

  rewrites: {
    "pt/:rest*": ":rest*",
  },
  srcExclude: ["en/**/*.md", "zh/**/*.md"],
  locales: {
    root: {
      label: "Português",
      ...pt,
    },
    en: {
      label: "English",
      link: "https://nixos-and-flakes.thiscute.world/",
    },
    zh: {
      label: "简体中文",
      link: "https://nixos-and-flakes.thiscute.world/zh/",
    },
    ja: {
      label: "日本語",
      link: "https://nixos-and-flakes-ja.hayao0819.com/",
    },
  },

  // For forks in other languages, here is an example of how to add a new locale:
  // rewrites: {
  //   "ja/:rest*": ":rest*",
  // },
  // // Exclude the original language's markdown files when build dist
  // // NOTE: You can still preview the original language's pages in dev mode
  // srcExclude: ['zh/**/*.md', 'en/**/*.md'],
  // locales: {
  //   // Your language's root configuration
  //   root: {
  //     label: 'Japanese',
  //     ...ja,
  //   },
  //
  //   // Languages maintained by the original author
  //   en: {
  //     label: 'English',
  //   link: "https://nixos-and-flakes.thiscute.world/",
  //   },
  //   zh: {
  //     label: '简体中文',
  //     link: "https://nixos-and-flakes.thiscute.world/zh/",
  //   },
  // },
})
