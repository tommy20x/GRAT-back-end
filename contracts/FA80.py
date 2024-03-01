import smartpy as sp

class FA80(sp.Contract):
  def __init__(self):
    self.init()

  @sp.entry_point
  def deposit(self):
    pass

sp.add_compilation_target("FA80", FA80())