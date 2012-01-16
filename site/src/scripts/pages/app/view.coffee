window.$V ?= {}

$ ->
  $V.AppView = Backbone.View.extend
    el: $ '#app'

    initialize: ->
      @lists = {}

      $D.entries.bind 'add', this.addOne, this
      $D.entries.bind 'reset', this.addAll, this

      do $D.entries.fetch

    addAll: ->
      $D.entries.each this.addOne

    addOne: (entry) ->
      $list_el = $('[user-id=' + entry.attributes.user_id + '] ul')

      view = new $V.Entry
        model: entry

      $list_el.append view.render().el

  window.App = new $V.AppView
