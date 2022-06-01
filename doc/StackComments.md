Most words in RETRO have a stack comment. These look like:

    (-)
    (nn-n)

As with all comments, a stack comment begins with ( and should end with 
a ). There are two parts to the comment. On the left side of the - is
what the word *consumes*. On the right is what it *leaves*.

RETRO uses a short notation, with one character per value taken or left.
In general, the following symbols represent certain types of values.

    b, n, m, o, x, y, z are generic numeric values           
    s represents a string
    v represents a variable
    p, a represent pointers
    q represents a quotation
    d represents a dictionary header
    f represents a `TRUE` or `FALSE` flag.

In the case of something like:  (xyz-m)
RETRO expects z to be on the top of the stack, with y below it and x below
the y value. And after execution, a single value (m) will be left on the
stack.

Words with no stack effect have a comment of (-)
