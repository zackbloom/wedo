window.$D ?= {}

$D.Entry = Backbone.Model.extend()

Entries = Backbone.Collection.extend
  model: $D.Entry
  localStorage: new Store 'list'

$D.entries = new Entries
