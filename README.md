# Table of Contents Plugin

The RemNote plugin that will create a table of contents from a note.

## Features

- Show the table of contents in the right sidebar.
- You can jump to the content by clicking it.

![working_sample](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/6c1d67da-c6c3-4fff-832d-56f9eb92c31e)

## How to use?
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

## TODO
- [ ] Beautiful scroll to display all the content even if jumping downward.
  - ![image](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/2fc98e06-4b05-4288-b7ad-dd605a9d0709)

<!-- ignore-after -->
