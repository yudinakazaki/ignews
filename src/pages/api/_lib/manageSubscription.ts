import { query as q } from 'faunadb'
import { stripe } from './../../../services/stripe';
import { fauna } from './../../../services/fauna';

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction: boolean = false
) {
  const [userRef, subscriptions] = await Promise.all([
    fauna.query(
      q.Select(
        'ref',
        q.Get(
          q.Match(
            q.Index('user_by_stripe_customer_id'),
            customerId
          )
        )
      )
    ),
    stripe.subscriptions.retrieve(subscriptionId)
  ])

  const subscriptionData = {
    id: subscriptions.id,
    userId: userRef,
    status: subscriptions.status,
    price_id: subscriptions.items.data[0].price.id
  }

  if (createAction) {
    return fauna.query(
      q.Create(
        q.Collection('subscriptions'),
        { data: subscriptionData }
      )
    )
  }

  return fauna.query(
    q.Replace(
      q.Select(
        'ref',
        q.Get(
          q.Match(
            q.Index('subscription_by_id'),
            subscriptionId
          )
        )
      ),
      { data: subscriptionData }
    )
  )
}