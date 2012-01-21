window.$V ?= {}

$ ->
  $V.Entry = Backbone.View.extend
    tagName: 'li'
    
    template: _.template '<div class="picker"></div> <%= label %>'

    render: ->
      $(this.el).html this.template this.model.toJSON()

      $('.picker', this.el).bind('pickerUpdate', (e, value) =>
        this.model.save
          priority: value

        return true

      ).picker
        value: this.model.attributes.priority

      $(this.el).attr 'start_time', this.model.start_time
      
      this
