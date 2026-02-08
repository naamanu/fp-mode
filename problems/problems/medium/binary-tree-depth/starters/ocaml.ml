type 'a tree = Leaf | Node of 'a * 'a tree * 'a tree

(* Compute the maximum depth of a binary tree.
   A Leaf has depth 0. *)
let rec depth t =
  failwith "TODO"
