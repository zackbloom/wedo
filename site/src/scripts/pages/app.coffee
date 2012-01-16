Ext.application
  name: 'WeDo'

  fullscreen: true

  launch: ->
    list = Ext.create 'Ext.List',
      store:
        fields: ['name']
        data: [
          {name: 'Bill'},
          {name: 'Frank'},
          {name: 'John'}
        ]
      
      itemConfig:
        tpl: 'K {name}'

    Ext.Viewport.add list

