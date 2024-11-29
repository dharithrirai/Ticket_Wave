import { useState } from 'react'
 
const TransferTicket = ({ ticketTransfer, account, provider, occasions }) => {

  const [occasionId, setOccasionId] = useState('')

  const [seat, setSeat] = useState('')

  const [recipient, setRecipient] = useState('')

  const [message, setMessage] = useState('')
 
  const transferTicket = async (e) => {

    e.preventDefault()

    try {

      const signer = provider.getSigner()

      const ticketTransferWithSigner = ticketTransfer.connect(signer)

      const transaction = await ticketTransferWithSigner.transferTicket(occasionId, seat, recipient)

      await transaction.wait()

      setMessage('Ticket transferred successfully!')

    } catch (error) {

      setMessage('Error transferring ticket: ' + error.message)

    }

  }
 
  return (
<div>
<h3>Transfer Ticket</h3>
<form onSubmit={transferTicket}>
<select value={occasionId} onChange={(e) => setOccasionId(e.target.value)}>
<option value="">Select Occasion</option>

          {occasions.map((occasion, index) => (
<option key={index} value={index + 1}>{occasion.name}</option>

          ))}
</select>
<input

          type="text"

          placeholder="Seat Number"

          value={seat}

          onChange={(e) => setSeat(e.target.value)}

        />
<input

          type="text"

          placeholder="Recipient Address"

          value={recipient}

          onChange={(e) => setRecipient(e.target.value)}

        />
<button type="submit">Transfer</button>
</form>

      {message && <p>{message}</p>}
</div>

  )

}
 
export default TransferTicket
 