window.$V ?= {}

$ ->
  $V.List = Backbone.View.extend
    tagName: 'ul'
    
    render: ->
      console.log ['rendering', this.model]

      this
