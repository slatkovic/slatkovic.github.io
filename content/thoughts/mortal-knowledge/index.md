---
title: Mortal Knowledge
date: 2026-03-05
---

Geoffrey Hinton spent fifty years teaching machines to learn, and the most interesting thing he figured out is how little we understand about learning itself.

Not the gradient descent kind. The real kind. The kind where something changes in you and you can't fully explain what or why, only that the world looks different afterward.

His recent work circles this question from several angles, and each one lands somewhere unexpected.

## The Forward-Forward Idea

Backpropagation is the engine behind every AI system you've ever used. It works by running data forward through a network, measuring the error at the end, then sending a correction signal backward through every layer. It's elegant. It's powerful. It's also nothing like how brains learn.

Hinton's Forward-Forward algorithm throws out the backward pass entirely. Instead, each layer in the network gets its own job: learn to tell the difference between real data and fake data. No global error signal. No waiting for instructions from above. Each layer just asks, does this feel right or wrong? And adjusts.

What's radical isn't the math. It's the implication. You don't need a master plan propagating down from the top for a system to learn. You need local judgment. Each part of the system developing its own sense of what's real.

This maps onto something bigger than neural networks. Every organization, every team, every creative process faces the same question: do you optimize top-down, with a single objective pushing corrections through every layer? Or do you give each layer its own sense of good and bad, and trust that coherence emerges?

The top-down way is cleaner on paper. The local way is how everything in nature actually works.

## Learning by Contrast

The Forward-Forward network doesn't learn from labeled examples. It learns from contrast. Here's real data; here's fake data. Can you tell the difference?

This is closer to how taste works. Nobody taught you to recognize good writing by giving you a thousand essays with scores attached. You read something great and something terrible, and over time a sense developed. Not a rule. A sense. You learned the difference between real and fake before you could explain why.

The best editors, designers, engineers — they all have this. A feeling for what's right that runs ahead of their ability to articulate it. Hinton's algorithm suggests this isn't a soft skill. It might be the more fundamental kind of learning. The labeled, supervised kind might be the shortcut.

## Dark Knowledge

Years earlier, Hinton worked on knowledge distillation — compressing a large model's knowledge into a smaller one. The trick was that the small model didn't learn from the right answers. It learned from the large model's uncertainties. When the big model said "this is 70% cat, 25% dog, 5% fox," that distribution carried more information than just "cat."

He called it dark knowledge. The knowledge that lives in the wrong answers.

Think about what this means for how we teach, write, summarize, or pass anything on. We strip out the uncertainty. We give people conclusions. The cat. But the 25% dog and 5% fox were doing real work. They encoded the relationships between things, the near-misses, the tension. When you compress knowledge down to just the answer, you lose the thing that made the knowledge transferable.

Every good teacher knows this instinctively. They don't just tell you the answer. They show you why the other answers almost work. That's where the real learning happens — in the space between right and almost right.

## Mortal Computation

Hinton's most recent provocation: all of our software assumes computation is immortal. You write a program, it runs on any hardware, it survives the machine it was born on. The knowledge is in the code, not the silicon.

But biological computation is mortal. Your knowledge lives in the specific tangle of your neurons. It can't be copied. It can't be uploaded. It dies with you.

We treat this as a limitation. Hinton suggests it might be a feature. Mortal computation — knowledge that's shaped by and inseparable from its specific substrate — might be capable of things immortal computation can't do. The very fact that it can't be abstracted away from its body might be what gives it depth.

This is the most unsettling idea of the five, because it cuts against everything technology promises. We want knowledge to be transferable, portable, scalable. We want to write it down and have it survive us. But what if the deepest kind of understanding is the kind that can't be extracted? What if expertise isn't just patterns that could theoretically be written down, but something that only exists in the specific architecture that grew it?

Every master craftsman who couldn't fully teach their craft. Every musician whose feel couldn't be transcribed. Every founder whose judgment couldn't survive their departure. Maybe that's not a failure of communication. Maybe that's the nature of mortal knowledge.

## The Pattern Underneath

Across fifty years, Hinton keeps arriving at the same place: the way we build thinking systems works, but it's unnatural. Backpropagation works but brains don't do it. Immortal software works but biology doesn't use it. Supervised learning works but taste doesn't form that way.

Each time, the engineering solution and the true solution are different things. The engineering solution is global, top-down, and transferable. The true solution is local, embodied, and mortal.

We're building AI with the engineering solutions. They work. They'll keep working. But somewhere underneath, there's a different way — one where each part learns on its own, where knowledge lives in uncertainty, where understanding is inseparable from the thing that understands.

Hinton hasn't found it yet. But he's been pointing at it for fifty years, and the direction hasn't changed.
