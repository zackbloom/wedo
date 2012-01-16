update_height = ->
  # Set the height of the main list to the viewport size and the
  # side lists to 95% of the viewport height.
  #
  # Note: No provision exists for when there are too many items
  # on the list to fit on one page (e.g. scrolling).

  height = $(window).height()

  height -= $('.list h3').outerHeight()
  height -= $('.list').outerHeight() - $('.list ul').outerHeight()

  $('.list ul').height(height + 'px')
  $('.left ul, .right ul').height(height * .95 + 'px')

$ update_height

$(window).resize update_height
