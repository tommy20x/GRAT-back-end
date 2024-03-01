import smartpy as sp
FA2 = sp.io.import_script_from_url("https://smartpy.io/templates/fa2_lib.py")

ADMIN = "tz1hmPbNNcaH91bkrYDeyAbUmYzjbPtJjPQR"
admin = sp.address(ADMIN)
token = FA2.make_metadata(name="PiXLtez", decimals=2, symbol="PXL")

class PiXLTez(
    FA2.Admin,
    FA2.ChangeMetadata,
    FA2.WithdrawMutez,
    FA2.MintFungible,
    FA2.BurnFungible,
    FA2.OnchainviewBalanceOf,
    FA2.OffchainviewTokenMetadata,
    FA2.Fa2Fungible
):
    def __init__(self, policy=None):
            FA2.Fa2Fungible.__init__(
                self,
                metadata=sp.utils.metadata_of_url("ipfs://example"),
                token_metadata=[token],
                ledger={(admin, 0): 10000},
                policy=policy
            )
            FA2.Admin.__init__(self, admin)


sp.add_compilation_target("PiXLTez", PiXLTez())
