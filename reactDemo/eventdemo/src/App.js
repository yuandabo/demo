import React,{Component,Fragment} from 'react'

class App extends Component{
  constructor(props){
    super(props)
    this.state={
      value:'yuandabo'
    }
  }
  render(){
    return (
        <Fragment>
          <input value={this.state.value} onChange={this.inputClick.bind(this)} />
          <div>{this.state.value}</div>
        </Fragment>
      )
    
  }
  inputClick(e){
    this.setState({
      value:e.target.value
    })
  }
}

export default App