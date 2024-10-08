# Table of Contents Plugin

This RemNote plugin creates a table of contents from your note automatically.

This idea comes from the below plugin request.<br/>
https://feedback.remnote.com/p/ability-to-create-a-table-of-contents

## Features

- Show the table of contents in the right sidebar.
- You can jump to the content by clicking it.

![working_sample](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/6c1d67da-c6c3-4fff-832d-56f9eb92c31e)

## How to use it?

- What will be displayed?
  - headings are automatically displayed in the right sidebar
    - the inner contents are ignored
  - but if the inner contents are also headings, they will be displayed
- How to jump?
  - click the link in the table of contents
  - if the content jumping to is inside the collapsed rem, it will be automatically expanded

## More details

See the below image or under texts (for reading)
![image](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/a7ceb146-f6ea-4925-ae75-b1e9c5dc9f87)

- heading "size" does not affect how it will be displayed
  - [h1] This is ok
  - [h3] This is also ok
- the maximum depth to be able to display is four
  - depth ⇒ the count of nesting from the top
    - DEPTH: 4 – this heading will be displayed
      - DEPTH: 5 – THIS HEADING WON'T BE DISPLAYED
- indirect headings are not displayed
  - The table of contents only displays headings directly underneath the parent heading.
    - this heading is not displayed because it is not directly underneath the heading content

<!-- ignore-after -->

## Release

1. develop locally with `yarn dev`
   - take care of using macOS app rather than web
2. update manifest version
3. run `yarn build`
4. upload the PluginZip.zip to market
5. wait for approval
