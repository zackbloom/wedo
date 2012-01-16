window.$V ?= {}

$ ->
  $V.Entry = Backbone.View.extend
    tagName: 'li'
    
    template: _.template '<%= label %>'

    render: ->
      $(this.el).html this.template this.model.toJSON()

      this
