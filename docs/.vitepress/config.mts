import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "RepoWatch",
  description: "TODO - Replace with your project description.",
  base: '/RepoWatch/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'GitHub', link: 'https://github.com/ScottKirvan/RepoWatch' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ScottKirvan/RepoWatch' },
      { icon: 'discord', link: 'https://discord.gg/TN6XJSNK5Y' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Scott Kirvan'
    }
  }
})
