import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { WindowRefService } from './window-ref.service';

interface transaction {
  _id: string;
  user: string;
  type: 'withdraw' | 'deposit';
  amount: number;
  razorpay_payment_id: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  __v: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-project';

  transaction!: transaction
  constructor(private readonly http: HttpClient, private winRef: WindowRefService) { }

  createOrder() {
    let requesDetails = {
      userId: '67cad965928cc89c2c0c8c93',
      amount: 10
    }
    this.http.post('http://localhost:5000/api/payments/create-order', requesDetails).subscribe((data: any) => {
      this.transaction = data['transaction']
      this.payWithRazor(this.transaction);
    }
    )
  }

  verifyPayment(response: any) {
    let requestDetails = {
      ...response,
      transaction_id: this.transaction._id,
      userId: this.transaction.user,
    };

    console.log({ requestDetails });
    this.http.post('http://localhost:5000/api/payments/verify-payment', requestDetails).subscribe(data => {
      console.log(data);

    }
    )
  }


  payWithRazor(transaction: transaction) {
    const options: any = {
      key: 'rzp_test_LoXdNfkScUpaWE',
      amount: transaction, // amount should be in paise format to display Rs 1255 without decimal point
      currency: 'INR',
      name: '', // company name or product name
      description: '',  // product description
      image: './assets/logo.png', // company logo or product image
      order_id: transaction.razorpay_payment_id, // order_id created by you in backend
      modal: {
        // We should prevent closing of the form when esc key is pressed.
        escape: false,
      },
      notes: {
        // include notes if any
      },
      theme: {
        color: '#0c238a'
      }
    };
    options.handler = ((response: any, error: any) => {
      options.response = response;
      this.verifyPayment({
        ...response,
        status: 'Success',
        description: 'Reward earned from quiz.'
      })
    });
    options.modal.ondismiss = (() => {
      // handle the case when user closes the form while transaction is in progress
      this.verifyPayment({
        status: 'Failed',
        description: 'Transaction cancelled.'
      })
    });
    const rzp = new this.winRef.nativeWindow.Razorpay(options);
    rzp.open();
  }
}
