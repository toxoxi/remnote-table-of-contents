# Table of Contents

The RemNote plugin that will create a table of contents from a note.

## Features

- Show the table of contents in the right sidebar.
- You can jump to the content by clicking it.

![working_sample](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/1333d9cb-e09b-4335-a55b-93eea1bc84ec)

## How to use?
- What will be displayed?
  - headings are automatically displayed in the right sidebar
    - the inner contents are ignored
  - but if the inner contents are also headings, it will be displayed
- How to jump?
  - simply click the link in the table of contents
  - if the content jumping to is inside the collapsed rem, it will be automatically expanded

## More details
![image](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/81233b0a-0342-45cc-9dc1-071c5ac0817b)

- heading "size" does not affect how it will be displayed
  - [h1] This is ok
  - [h3] This is also ok
- the maximum depth to be able to display is four
  - depth ⇒ the count of nesting from the top
    - DEPTH: 4 – this heading will be displayed
      - DEPTH: 5 – THIS HEADING WON'T BE DISPLAYED 
- indirect headings are not displayed
  - The table of contents only display headings that is directly underneath of the parent heading.
    - this heading is not displayed because is not directly underneath of the heading content

## TODO
- [ ] Beautiful scroll to display all the content even if jumping downward.
  - ![image](https://github.com/toxoxi/remnote-table-of-contents/assets/29012724/fee297f9-d15f-41a1-9c4e-b91a586d710c)

<!-- ignore-after -->
