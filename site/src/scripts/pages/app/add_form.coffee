$ ->
  $link = $ 'a[href=#add]'

  do $link.button

  $link.click (e) ->
    do e.preventDefault

    name = prompt("Task Name?")

    entry = $D.entries.create
      user_id: 'bob'
      label: name
