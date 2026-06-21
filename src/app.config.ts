export default defineAppConfig({
  pages: [
    'pages/calendar/index',
    'pages/today/index',
    'pages/mine/index',
    'pages/add-comic/index',
    'pages/comic-detail/index',
    'pages/hiatus/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#7B5CFF',
    navigationBarTitleText: '漫画追更日历',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F7F5FF'
  },
  tabBar: {
    color: '#A09DB0',
    selectedColor: '#7B5CFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/calendar/index',
        text: '追更日历'
      },
      {
        pagePath: 'pages/today/index',
        text: '今天可看'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
