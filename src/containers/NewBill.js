import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.allowedFileExtentions = ["jpg", "jpeg", "png"]
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.fileInput = this.document.querySelector(`input[data-testid="file"]`)
    this.formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    this.formNewBill.addEventListener("submit", this.handleSubmit)
    this.fileInput.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const file = e.target.files[0];
    if (!this.isFileAllowed(file)) {
      this.fileInput.setCustomValidity("Seul les images jp(e)g et png sont prises en charges.")
      return
    } else {
      this.fileInput.setCustomValidity("")
    }

    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = file.name
      }).catch(error => console.error(error))
  }
  handleSubmit = e => {
    e.preventDefault()
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    // this.onNavigate(ROUTES_PATH['Bills'])
  }

  isFileAllowed = (file) => {
    if (!file.type.startsWith("image/")) return false
    return this.allowedFileExtentions.includes(file.name.split(".").pop());
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}
